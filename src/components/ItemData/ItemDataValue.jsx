import { Link } from '@digdir/designsystemet-react';

export default function ItemDataValue({ value }) {
    if (value === null) return '-';

    if (typeof value === 'string' && value.startsWith('http')) {
        return (
            <Link href={value} target="_blank" rel="noopener noreferrer">
                {value}
            </Link>
        );
    }

    return String(value);
}
