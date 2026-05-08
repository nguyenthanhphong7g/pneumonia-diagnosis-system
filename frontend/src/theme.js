import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb',
            light: '#3b82f6',
            dark: '#1e40af',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#7c3aed',
            light: '#a78bfa',
            dark: '#5b21b6',
            contrastText: '#ffffff',
        },
        success: {
            main: '#10b981',
            light: '#6ee7b7',
            dark: '#065f46',
        },
        error: {
            main: '#ef4444',
            light: '#fca5a5',
            dark: '#7f1d1d',
        },
        warning: {
            main: '#f59e0b',
            light: '#fde047',
            dark: '#92400e',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
        h1: {
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 700,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
        },
        h5: {
            fontSize: '1.1rem',
            fontWeight: 600,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-2px)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '0.5rem',
                        transition: 'all 0.3s ease',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        borderLeft: '4px solid #2563eb',
                        paddingLeft: 'calc(1rem - 4px)',
                        '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.16)',
                        },
                    },
                },
            },
        },
    },
    shape: {
        borderRadius: 8,
    },
});

export default theme;
