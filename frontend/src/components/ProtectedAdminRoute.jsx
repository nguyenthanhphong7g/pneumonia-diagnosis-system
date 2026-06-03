import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, Container, Typography } from '@mui/material';

/**
 * Protected route component - chỉ cho phép các role được khai báo
 */
const ProtectedAdminRoute = ({ children, allowedRoles = [] }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const currentRole = String(user.role || '').toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toUpperCase());

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
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
                        Bạn không có quyền truy cập trang này.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return children;
};

export default ProtectedAdminRoute;
