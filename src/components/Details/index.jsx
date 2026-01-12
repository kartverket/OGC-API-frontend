import styles from './Details.module.css';

export default function Details({ children }) {
    return (
        <div className={`${styles.detailsWrapper} detailsWrapper`}>
            <div className={styles.details}>
                {children}
            </div>
        </div>
    );
}