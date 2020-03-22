import React from 'react';
import styles from './styles.module.scss';

const SearchResults = ({ inputQuery, linksFound, isFinished, queryErrorText }) => {
  return (
    <div className={styles.container}>
      {linksFound &&
        linksFound.map((link, index) => {
          return (
            <span key={index}>
              {link} {index !== linksFound.length - 1 ? ' -> ' : ''}
            </span>
          );
        })}
      {isFinished && <p>Trouvé après avoir parcouru {linksFound.length} liens</p>}
      {queryErrorText !== '' && <p>{queryErrorText}</p>}
    </div>
  );
};

export default SearchResults;
