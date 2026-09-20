import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  MenuItem,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  DoneAll as DeliveredIcon,
  Schedule as WindowIcon,
  MarkEmailRead as ReadIcon,
  LockClock as ExpiredIcon,
} from '@mui/icons-material';

interface ConversationItem {
  id: string;
  channel: 'email' | 'whatsapp';
  status: string;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count: number;
  window_expires_at?: string;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
}

interface MessageItem {
  id: string;
  sender_type: 'user' | 'lead' | 'system';
  channel: 'email' | 'whatsapp';
  direction: 'inbound' | 'outbound';
  body: string;
  delivery_status: string;
  created_at: string;
}

export const UnifiedInboxPage: React.FC = () => {
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Message composer state
  const [composeChannel, setComposeChannel] = useState<'email' | 'whatsapp'>('email');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [channelFilter]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      setComposeChannel(selectedConversation.channel);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/inbox/conversations?channel=${channelFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: ConversationItem[] = data.data || [];
      setConversations(list);
      if (list.length > 0 && !selectedConversation) {
        setSelectedConversation(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/inbox/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inbox/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          channel: composeChannel,
          body: messageText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessageText('');
        fetchMessages(selectedConversation.id);
        fetchConversations();
      } else {
        alert(data.error?.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const isWaWindowActive = (expStr?: string) => {
    if (!expStr) return false;
    return new Date(expStr).getTime() > Date.now();
  };

  const filteredConversations = conversations.filter((c) => {
    const name = `${c.lead?.first_name || ''} ${c.lead?.last_name || ''}`.toLowerCase();
    const company = (c.lead?.company_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Unified Multi-Channel Inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aggregate Email & Meta WhatsApp Cloud API conversations with 24-hr customer service window tracking.
        </Typography>
      </Box>

      {/* 3-Pane Layout */}
      <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: 2, display: 'flex', overflow: 'hidden' }}>
        {/* Pane 1: Left Navigation Filters */}
        <Box
          sx={{
            width: 220,
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2,
            bgcolor: 'action.hover',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
            CHANNELS
          </Typography>
          <Stack spacing={1}>
            <Button
              variant={channelFilter === 'all' ? 'contained' : 'text'}
              color="primary"
              fullWidth
              onClick={() => setChannelFilter('all')}
              sx={{ justifyContent: 'flex-start' }}
            >
              All Messages
            </Button>
            <Button
              variant={channelFilter === 'email' ? 'contained' : 'text'}
              color="primary"
              startIcon={<EmailIcon />}
              fullWidth
              onClick={() => setChannelFilter('email')}
              sx={{ justifyContent: 'space-between' }}
            >
              Email Threads
              <Chip label="Upcoming" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
            </Button>
            <Button
              variant={channelFilter === 'whatsapp' ? 'contained' : 'text'}
              color="primary"
              startIcon={<WhatsAppIcon />}
              fullWidth
              onClick={() => setChannelFilter('whatsapp')}
              sx={{ justifyContent: 'space-between' }}
            >
              WhatsApp API
              <Chip label="Upcoming" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
            </Button>
          </Stack>
        </Box>

        {/* Pane 2: Middle Conversation Roster */}
        <Box
          sx={{
            width: 320,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={30} />
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="caption">No active conversations</Typography>
              </Box>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const leadName = conv.lead ? `${conv.lead.first_name} ${conv.lead.last_name}` : 'Unknown Lead';

                return (
                  <ListItem key={conv.id} disablePadding>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedConversation(conv)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: conv.channel === 'whatsapp' ? '#25D366' : 'primary.main', width: 36, height: 36 }}>
                          {conv.channel === 'whatsapp' ? <WhatsAppIcon fontSize="small" /> : <EmailIcon fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                              {leadName}
                            </Typography>
                            {conv.last_message_at && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {conv.last_message_preview || 'No messages yet'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>

        {/* Pane 3: Right Active Message Thread & Composer */}
        {selectedConversation ? (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: selectedConversation.channel === 'whatsapp' ? '#25D366' : 'primary.main' }}>
                  {selectedConversation.lead?.first_name?.[0] || 'L'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {selectedConversation.lead
                      ? `${selectedConversation.lead.first_name} ${selectedConversation.lead.last_name}`
                      : 'Lead Conversation'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedConversation.lead?.company_name ? `${selectedConversation.lead.company_name} • ` : ''}
                    {selectedConversation.channel === 'whatsapp'
                      ? selectedConversation.lead?.phone || 'WhatsApp'
                      : selectedConversation.lead?.email || 'Email'}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={selectedConversation.channel === 'whatsapp' ? <WhatsAppIcon style={{ fontSize: 14 }} /> : <EmailIcon style={{ fontSize: 14 }} />}
                label={selectedConversation.channel.toUpperCase()}
                color={selectedConversation.channel === 'whatsapp' ? 'success' : 'primary'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            {/* WhatsApp 24-Hour Service Window Banner */}
            {selectedConversation.channel === 'whatsapp' && (
              <Box sx={{ px: 2, pt: 1.5 }}>
                {isWaWindowActive(selectedConversation.window_expires_at) ? (
                  <Alert severity="success" icon={<WindowIcon />} sx={{ py: 0.5, fontSize: '0.8rem' }}>
                    <strong>WhatsApp 24-Hour Customer Service Window Active</strong> — Free-form messaging enabled.
                  </Alert>
                ) : (
                  <Alert severity="warning" icon={<ExpiredIcon />} sx={{ py: 0.5, fontSize: '0.8rem' }}>
                    <strong>24-Hour Customer Service Window Expired</strong> — Meta rules require sending an approved Template Message.
                  </Alert>
                )}
              </Box>
            )}

            {/* Scrollable Message History Stream */}
            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {messages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';

                return (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isOutbound ? 'primary.main' : 'background.paper',
                        color: isOutbound ? 'primary.contrastText' : 'text.primary',
                        border: isOutbound ? 'none' : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.body}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 0.8 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {isOutbound && <DeliveredIcon style={{ fontSize: 12 }} />}
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            </Box>

            {/* Bottom Message Composer */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Select
                  size="small"
                  value={composeChannel}
                  onChange={(e) => setComposeChannel(e.target.value as any)}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="email">Send via Email</MenuItem>
                  <MenuItem value="whatsapp">Send via WhatsApp API</MenuItem>
                </Select>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  size="small"
                  placeholder={`Write your ${composeChannel === 'whatsapp' ? 'WhatsApp' : 'email'} reply...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!messageText.trim() || sending}
                  endIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
            <Typography>Select a conversation to view messaging thread</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
