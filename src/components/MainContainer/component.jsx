import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import styles from './styles.module.scss';

import SearchResults from '../SearchResults';

const BASE_API_URL = 'https://fr.wikipedia.org/w/api.php?';
const REQUEST = 'rvprop=content&action=query&prop=revisions&format=json&origin=*';

const isInsideBrackets2 = (contentPage, idx) => {
  let depthBracket = 0;
  let depthSquareBracket = 0;

  // console.log(contentPage.slice(0, idx));

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

// const isValidContent = content => {
//   const forbiddenElements = ['Fichier', 'Image', 'File'];

//   forbiddenElements.forEach(element => {
//     if (content.includes(element)) return false;
//   });
//   return true;
// };

const getFirstLink = contentPage => {
  // console.log(contentPage);

  let idxSquareBrackets = 0;
  let currentIdx = 0;

  if (contentPage.includes('#REDIRECTION')) {
    const idxSquareBrackets = contentPage.indexOf('[[');
    const idxEndSquareBrackets = contentPage.indexOf(']]');

    return contentPage.slice(idxSquareBrackets + 2, idxEndSquareBrackets);
  }

  while (idxSquareBrackets !== -1) {
    let idxSquareBrackets = contentPage.indexOf('[[', currentIdx);

    if (!isInsideBrackets2(contentPage, idxSquareBrackets)) {
      const idxEndSquareBrackets = contentPage.indexOf(']]', idxSquareBrackets);
      let content = contentPage.slice(idxSquareBrackets + 2, idxEndSquareBrackets);

      if (!content.includes('Fichier') && !content.includes('Image') && !content.includes('File')) {
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
    // executeQuery(currentInput);
  };

  const executeQuery = useCallback(
    async currentInput => {
      console.log('Lancer la query avec ' + currentInput);
      console.log(linksFound);

      const response = await axios.get(BASE_API_URL + REQUEST + `&titles=${currentInput}`);

      console.log(response);
      const pages = response.data.query.pages;

      console.log(pages);

      if (Object.keys(pages).includes('-1')) {
        setQueryErrorText("Erreur : cette page n'existe pas");
      } else {
        let pageId = Object.keys(pages)[0];

        const firstLink = getFirstLink(pages[pageId].revisions[0]['*']);

        if (!linksFound.includes(firstLink)) {
          setLinksFounds(linksFound.concat(firstLink));

          console.log('Linksound length = ' + linksFound.length);
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
