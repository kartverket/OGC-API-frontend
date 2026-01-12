import { useId } from 'react';
import styles from '../Details.module.scss';

export default function DetailsSummary({ className, children }) {
    const id = useId();

    return (
        <>
            <input type="checkbox" id={id} />
            <label htmlFor={id} className={`${styles.detailsLabel} ${className || ''}`}>{children}</label>
        </>
    );
}