import React from 'react';
import { SUPPORTED_DIALECTS } from '../utils/dialects';

type Props = {
  dialectLinks?: Record<string, string>,
} | {
  features: Record<string, true | Record<string, string>>,
};

export function SupportTable(props: Props) {

  if ('features' in props) {
    const featureNames = Object.keys(props.features);

    return (
      <table>
        <thead>
          <tr>
            <td />
            {Array.from(SUPPORTED_DIALECTS).map(dialect => <td key={dialect}>{dialect}</td>)}
          </tr>
        </thead>
        <tbody>
          {featureNames.map(featureName => {
            const featureValue = props.features[featureName];

            return (
              <tr key={featureName}>
                <td>{featureName}</td>
                {Array.from(SUPPORTED_DIALECTS).map(dialect => {
                  const link = featureValue === true ? true : featureValue?.[dialect];

                  return <SupportCell link={link} key={dialect} />;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          {Array.from(SUPPORTED_DIALECTS).map(dialect => <td key={dialect}>{dialect}</td>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          {Array.from(SUPPORTED_DIALECTS).map(dialect => {
            const link = props.dialectLinks?.[dialect];

            return <SupportCell link={link} key={dialect} />;
          })}
        </tr>
      </tbody>
    </table>
  );
}

function SupportCell(props: { link: string | true | undefined }) {
  if (props.link) {
    const supportedIcon = <span title="Feature is supported" aria-label="Feature is supported" role="img">✔️</span>;

    return (
      <td>
        {props.link === true ? supportedIcon : (
          <a href={props.link} target="_blank" rel="noreferrer">
            {supportedIcon} (docs)
          </a>
        )}
      </td>
    );
  }

  return (
    <td>
      <span title="Feature is not supported" aria-label="Feature is not supported" role="img">❌</span>
    </td>
  );
}
