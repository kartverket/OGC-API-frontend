const ERRORS = {
    400: {
        title: 'Ugyldig forespørsel',
        text: 'Noe gikk galt med forespørselen. Vennligst prøv igjen.'
    },
    401: {
        title: 'Ikke innlogget / mangler tilgang',
        text: 'Du må være logget inn for å få tilgang til denne siden.'
    },
    403: {
        title: 'Ingen tilgang',
        text: 'Du har ikke rettigheter til å se denne siden.'
    },
    500: {
        title: 'Intern serverfeil',
        text: 'Det oppstod en intern feil. Vennligst prøv igjen senere.'
    },
    502: {
        title: 'Ugyldig svar fra server',
        text: 'Tjenesten er midlertidig utilgjengelig.'
    },
    503: {
        title: 'Tjenesten er utilgjengelig',
        text: 'Tjenesten er for øyeblikket utilgjengelig. Prøv igjen litt senere.'
    },
    504: {
        title: 'Tidsavbrudd',
        text: 'Forespørselen tok for lang tid. Vennligst prøv igjen.'
    }
};

export function getErrorData(status) {
    let error = ERRORS[status];
    let code = status;

    if (error === undefined) {
        error = ERRORS[500];
        code = 500;
    }
    
    return {
        ...error,
        code
    };
}