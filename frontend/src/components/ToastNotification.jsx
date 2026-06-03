import { Snackbar, Alert } from '@mui/material';

function ToastNotification({ open, message, severity = 'info', onClose, autoHideDuration = 3000 }) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%', borderRadius: 2, boxShadow: '0 12px 24px rgba(0,0,0,0.16)' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}

export default ToastNotification;
