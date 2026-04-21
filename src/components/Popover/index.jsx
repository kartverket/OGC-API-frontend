import styles from './Popover.module.css';

export default function Popover({ style, children }) {   
    return (
        <div className={styles.popover} style={style}>
            {children}
            <div className={styles.popoverArrow}></div>
        </div>
    );
}