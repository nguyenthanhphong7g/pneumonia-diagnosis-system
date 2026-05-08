import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Container, Typography, TextField, Button, Card, CardContent,
  Alert, Box, CircularProgress, Paper, Divider
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LockIcon from '@mui/icons-material/Lock';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password
      });

      login(res.data.token, res.data.username, res.data.role, res.data.userId);
      alert('Đăng nhập thành công!');
      // Navigate based on role
      if (res.data.role === 'DOCTOR') {
        navigate('/review');
      } else {
        navigate('/');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        py: 4,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '500px',
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Card
          sx={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            borderRadius: '1rem',
          }}
        >
          <CardContent sx={{ p: 3, pt: 3 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2.5 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <LockIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}
              >
                Đăng nhập
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Truy cập hệ thống chẩn đoán viêm phổi
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                label="Tên đăng nhập"
                fullWidth
                margin="normal"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{ mb: 2 }}
                inputProps={{ autoComplete: 'username' }}
              />

              <TextField
                label="Mật khẩu"
                type="password"
                fullWidth
                margin="normal"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 1 }}
                inputProps={{ autoComplete: 'current-password' }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 3,
                  mb: 1.5,
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: '1rem',
                }}
                disabled={loading}
                startIcon={loading ? undefined : <LoginIcon />}
              >
                {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                Chưa có tài khoản?
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/register')}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Tạo tài khoản mới
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Login;