import ItemDataValue from './ItemDataValue';
import styles from './ItemData.module.css';

const INDENT_PX = 16;

export default function ItemDataProperty({ data, level = 0, label = null, classNames = {} }) {
    const indent = ((level - 1) * INDENT_PX);

    if (data === null || typeof data !== 'object') {
        return (
            <div className={classNames.row ?? styles.row}>
                <div className={classNames.label ?? styles.label} style={{ marginLeft: indent }}>{label}</div>
                <div className={classNames.value ?? styles.value}>
                    <ItemDataValue value={data} />
                </div>
            </div>
        );
    }

    if (Array.isArray(data)) {
        return (
            <div>
                {label && (
                    <div
                        className={classNames.label ?? styles.label}
                        style={{ marginLeft: indent }}
                    >
                        {label}
                    </div>
                )}

                {data.map((item, index) => (
                    <ItemDataProperty
                        key={index}
                        data={item}
                        level={level + 1}
                        label={`[${index}]`}
                        classNames={classNames}
                    />
                ))}
            </div>
        );
    }

    return (
        <div>
            {label && (
                <div
                    className={styles.label}
                    style={{ marginLeft: indent }}
                >
                    {label}
                </div>
            )}

            {Object.entries(data).map(([key, value]) => (
                <ItemDataProperty
                    key={key}
                    data={value}
                    level={level + 1}
                    label={key}
                    classNames={classNames}
                />
            ))}
        </div>
    );
}
