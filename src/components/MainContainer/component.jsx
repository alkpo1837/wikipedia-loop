import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import styles from './styles.module.scss';

import SearchResults from '../SearchResults';

const BASE_API_URL = 'https://fr.wikipedia.org/w/api.php?';
const REQUEST = 'rvprop=content&action=query&prop=revisions&format=json&origin=*';

const isInsideBrackets = (contentPage, idx) => {
  let depthBracket = 0;
  let depthSquareBracket = 0;

  for (let i = 0; i !== idx; i++) {
    if (contentPage[i] === '{' && contentPage[i + 1] === '{') {
      depthBracket++;
      i++;
    } else if (contentPage[i] === '}' && contentPage[i + 1] === '}') {
      depthBracket--;
      i++;
    } else if (contentPage[i] === '[' && contentPage[i + 1] === '[') {
      depthSquareBracket++;
      i++;
    } else if (contentPage[i] === ']' && contentPage[i + 1] === ']') {
      depthSquareBracket--;
      i++;
    }
  }
  return depthBracket > 0 || depthSquareBracket > 0;
};

const isValidContent = content => {
  const forbiddenElements = ['Fichier', 'Image', 'File'];

  for (let i = 0; i < forbiddenElements.length; i++) {
    if (content.includes(forbiddenElements[i])) return false;
  }
  // forbiddenElements.forEach(element => {
  //   console.log(content + ' vs ' + element);
  //   if (content.includes(element)) {
  //     return false;
  //   }
  // });

  return true;
};

const getFirstLink = contentPage => {
  let idxSquareBrackets = 0;
  let currentIdx = 0;

  if (contentPage.includes('#REDIRECTION')) {
    const idxSquareBrackets = contentPage.indexOf('[[');
    const idxEndSquareBrackets = contentPage.indexOf(']]');

    return contentPage.slice(idxSquareBrackets + 2, idxEndSquareBrackets);
  }

  while (idxSquareBrackets !== -1) {
    let idxSquareBrackets = contentPage.indexOf('[[', currentIdx);

    if (!isInsideBrackets(contentPage, idxSquareBrackets)) {
      const idxEndSquareBrackets = contentPage.indexOf(']]', idxSquareBrackets);
      let content = contentPage.slice(idxSquareBrackets + 2, idxEndSquareBrackets);

      if (isValidContent(content)) {
        if (content.includes('|')) content = content.split('|')[0];

        return content;
      }
    }

    currentIdx = idxSquareBrackets + 1;
  }

  return '';
};

const MainContainer = () => {
  const [currentInput, setcurrentInput] = useState('');
  const [queryErrorText, setQueryErrorText] = useState('');
  const [isQueryFinished, setIsQueryFinished] = useState(false);

  const [linksFound, setLinksFounds] = useState([]);

  const onSearchButtonClicked = () => {
    setLinksFounds([currentInput]);
    setIsQueryFinished(false);
  };

  const executeQuery = useCallback(
    async currentInput => {
      const response = await axios.get(BASE_API_URL + REQUEST + `&titles=${currentInput}`);
      const pages = response.data.query.pages;

      let pageId = Object.keys(pages)[0];
      if (pageId === '-1') {
        setQueryErrorText("Erreur : cette page n'existe pas");
      } else {
        const firstLink = getFirstLink(pages[pageId].revisions[0]['*']);

        if (!linksFound.includes(firstLink)) {
          setLinksFounds(linksFound.concat(firstLink));
        } else {
          setIsQueryFinished(true);
          setLinksFounds(linksFound.concat(firstLink));
        }
      }
    },
    [linksFound]
  );

  useEffect(() => {
    if (linksFound.length > 0 && !isQueryFinished) executeQuery(linksFound[linksFound.length - 1]);
  }, [executeQuery, isQueryFinished, linksFound]);

  return (
    <div className={styles.container}>
      <p>Rentrer le nom d'un article Wikipedia</p>
      <input value={currentInput} className={styles.input} onChange={event => setcurrentInput(event.target.value)}></input>
      <button onClick={onSearchButtonClicked}>Chercher</button>

      <SearchResults inputQuery={currentInput} linksFound={linksFound} isFinished={isQueryFinished} queryError={queryErrorText} />
    </div>
  );
};

export default MainContainer;
