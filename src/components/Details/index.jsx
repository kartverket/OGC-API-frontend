import styles from './Details.module.scss';

export default function Details({ children }) {
    return (
        <div className={`${styles.detailsWrapper} detailsWrapper`}>
            <div className={styles.details}>
                {children}
            </div>
        </div>
    );
}