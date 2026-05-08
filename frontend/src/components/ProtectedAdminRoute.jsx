import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, Container, Typography } from '@mui/material';

/**
 * Protected route component - chỉ cho phép ADMIN role
 */
const ProtectedAdminRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'ADMIN') {
        return (
            <Container maxWidth="sm">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h4" sx={{ marginBottom: '1rem', color: '#c62828' }}>
                        ❌ Access Denied
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Bạn không có quyền truy cập trang này. Chỉ ADMIN mới có thể xem.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return children;
};

export default ProtectedAdminRoute;
