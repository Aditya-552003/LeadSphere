import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import {
  Psychology as AiIcon,
  AutoAwesome as SparklesIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Security as SecurityIcon,
  TrendingUp as SentimentIcon,
  Email as EmailIcon,
  Description as SummaryIcon,
} from '@mui/icons-material';

interface LeadOption {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

export const AiAssistantPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Tool 1: Summarizer
  const [selectedLeadSummaryId, setSelectedLeadSummaryId] = useState('');
  const [summaryResult, setSummaryResult] = useState<string[]>([]);
  const [summarizing, setSummarizing] = useState(false);

  // Tool 2: Email Drafter
  const [selectedLeadDraftId, setSelectedLeadDraftId] = useState('');
  const [draftTone, setDraftTone] = useState<'professional' | 'persuasive' | 'casual'>('professional');
  const [draftResult, setDraftResult] = useState<{ subject: string; body: string } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tool 3: Sentiment Classifier
  const [replyInput, setReplyInput] = useState('');
  const [sentimentResult, setSentimentResult] = useState<any>(null);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.data || [];
      setLeads(list);
      if (list.length > 0) {
        setSelectedLeadSummaryId(list[0].id);
        setSelectedLeadDraftId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load leads for AI tools:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedLeadSummaryId) return;
    setSummarizing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ai/summarize-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leadId: selectedLeadSummaryId }),
      });
      const data = await res.json();
      setSummaryResult(data.data?.summary || []);
    } catch (err) {
      console.error('Failed to summarize lead:', err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleDraftEmail = async () => {
    if (!selectedLeadDraftId) return;
    setDrafting(true);
    setCopied(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ai/draft-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leadId: selectedLeadDraftId, tone: draftTone }),
      });
      const data = await res.json();
      setDraftResult(data.data || null);
    } catch (err) {
      console.error('Failed to draft email:', err);
    } finally {
      setDrafting(false);
    }
  };

  const handleClassifySentiment = async () => {
    if (!replyInput.trim()) return;
    setClassifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ai/classify-sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyInput }),
      });
      const data = await res.json();
      setSentimentResult(data.data || null);
    } catch (err) {
      console.error('Failed to classify sentiment:', err);
    } finally {
      setClassifying(false);
    }
  };

  const handleCopyDraft = () => {
    if (!draftResult) return;
    const textToCopy = `Subject: ${draftResult.subject}\n\n${draftResult.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AiIcon color="primary" fontSize="large" /> AI Intelligence & Copilot Studio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI executive summaries, outreach email generation, and prompt-injection-hardened sentiment analysis.
          </Typography>
        </Box>

        <Chip
          icon={<SecurityIcon style={{ fontSize: 16 }} />}
          label="AI-generated — verify before send"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Grid of AI Tools */}
      <Grid container spacing={3}>
        {/* Tool 1: Lead Executive Summarizer */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SummaryIcon color="primary" /> Executive Lead Summarizer
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Target Lead</InputLabel>
                <Select
                  value={selectedLeadSummaryId}
                  label="Select Target Lead"
                  onChange={(e) => setSelectedLeadSummaryId(e.target.value)}
                >
                  {leads.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} {l.company_name ? `(${l.company_name})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={summarizing ? <CircularProgress size={18} /> : <SparklesIcon />}
                onClick={handleGenerateSummary}
                disabled={summarizing || !selectedLeadSummaryId}
              >
                Generate Lead Briefing
              </Button>
            </Stack>

            {summaryResult.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                  EXECUTIVE BRIEFING POINTS:
                </Typography>
                <Stack spacing={1}>
                  {summaryResult.map((point, idx) => (
                    <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      • {point}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Paper>
        </Grid>

        {/* Tool 2: Outreach Email Drafter */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" /> AI Outreach Email Drafter
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Target Lead</InputLabel>
                  <Select
                    value={selectedLeadDraftId}
                    label="Select Target Lead"
                    onChange={(e) => setSelectedLeadDraftId(e.target.value)}
                  >
                    {leads.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.first_name} {l.last_name} {l.company_name ? `(${l.company_name})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ width: 160 }}>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={draftTone}
                    label="Tone"
                    onChange={(e) => setDraftTone(e.target.value as any)}
                  >
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="persuasive">Persuasive</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="contained"
                startIcon={drafting ? <CircularProgress size={18} /> : <SparklesIcon />}
                onClick={handleDraftEmail}
                disabled={drafting || !selectedLeadDraftId}
              >
                Draft Outreach Message
              </Button>
            </Stack>

            {draftResult && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Subject: {draftResult.subject}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={copied ? <CheckIcon color="success" /> : <CopyIcon />}
                    onClick={handleCopyDraft}
                  >
                    {copied ? 'Copied!' : 'Copy Draft'}
                  </Button>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {draftResult.body}
                </Typography>
              </Paper>
            )}
          </Paper>
        </Grid>

        {/* Tool 3: Reply Sentiment & Intent Classifier */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SentimentIcon color="primary" /> Inbound Reply Sentiment & Intent Classifier
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Paste Inbound Lead Reply Text"
                  placeholder="e.g., Thanks for reaching out! We are interested, but can you send your pricing packages?"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={classifying ? <CircularProgress size={18} /> : <SparklesIcon />}
                  onClick={handleClassifySentiment}
                  disabled={classifying || !replyInput.trim()}
                >
                  Analyze Sentiment & Intent
                </Button>
              </Grid>

              <Grid item xs={12} md={5}>
                {sentimentResult ? (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      CLASSIFICATION RESULTS
                    </Typography>

                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Sentiment:</Typography>
                        <Chip
                          label={sentimentResult.sentiment.toUpperCase()}
                          color={
                            sentimentResult.sentiment === 'positive'
                              ? 'success'
                              : sentimentResult.sentiment === 'objection'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Detected Intent:</Typography>
                        <Chip label={sentimentResult.intent} variant="outlined" color="primary" size="small" />
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          RECOMMENDED ACTION:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mt: 0.5 }}>
                          {sentimentResult.recommended_action}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption">Paste a reply snippet to analyze lead sentiment</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
