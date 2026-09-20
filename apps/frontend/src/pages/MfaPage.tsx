import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

export const MfaPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit TOTP code');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', p: 2, textAlign: 'center' }}>
        <CardContent>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
            <SecurityIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Two-Factor Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the 6-digit authentication code from your authenticator app.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleVerify}>
            <TextField
              fullWidth
              label="6-Digit Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.4rem', fontSize: '1.4rem' } }}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.2 }}
            >
              Verify Code
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
