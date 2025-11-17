import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Search,
  Award,
  Eye,
  Plus,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Story {
  id: string;
  title: string;
  content: string;
  location: string;
  date_occurred: string;
  category: string;
  author_id: string;
  image_urls: string[];
  video_urls: string[];
  is_verified: boolean;
  credibility_score: number;
  investigation_count: number;
  created_at: string;
  profiles_2025_11_16_17_00: {
    username: string;
    avatar_url: string;
    level: number;
  };
}

interface Investigation {
  id: string;
  story_id: string;
  investigator_id: string;
  theory: string;
  evidence: string;
  evidence_urls: string[];
  votes: number;
  created_at: string;
  profiles_2025_11_16_17_00: {
    username: string;
    avatar_url: string;
    level: number;
  };
}

interface Comment {
  id: string;
  story_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles_2025_11_16_17_00: {
    username: string;
    avatar_url: string;
    level: number;
  };
}

interface StoryDetailProps {
  story: Story;
  user: User;
  onBack: () => void;
  onStoryUpdate: () => void;
}

export default function StoryDetail({ story, user, onBack, onStoryUpdate }: StoryDetailProps) {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newInvestigation, setNewInvestigation] = useState('');
  const [newEvidence, setNewEvidence] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvestigations();
    fetchComments();
  }, [story.id]);

  const fetchInvestigations = async () => {
    try {
      const { data, error } = await supabase
        .from('investigations_2025_11_16_17_00')
        .select(`
          *,
          profiles_2025_11_16_17_00 (
            username,
            avatar_url,
            level
          )
        `)
        .eq('story_id', story.id)
        .order('votes', { ascending: false });

      if (error) throw error;
      setInvestigations(data || []);
    } catch (error: any) {
      console.error('Error fetching investigations:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments_2025_11_16_17_00')
        .select(`
          *,
          profiles_2025_11_16_17_00 (
            username,
            avatar_url,
            level
          )
        `)
        .eq('story_id', story.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitInvestigation = async () => {
    if (!newInvestigation.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('investigations_2025_11_16_17_00')
        .insert({
          story_id: story.id,
          investigator_id: user.id,
          theory: newInvestigation,
          evidence: newEvidence || null
        });

      if (error) throw error;

      toast({
        title: "Investigação adicionada!",
        description: "Sua teoria foi compartilhada com a comunidade.",
      });

      setNewInvestigation('');
      setNewEvidence('');
      fetchInvestigations();
      onStoryUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar investigação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments_2025_11_16_17_00')
        .insert({
          story_id: story.id,
          author_id: user.id,
          content: newComment
        });

      if (error) throw error;

      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado.",
      });

      setNewComment('');
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const voteInvestigation = async (investigationId: string, voteType: number) => {
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('investigation_votes_2025_11_16_17_00')
        .select('*')
        .eq('investigation_id', investigationId)
        .eq('voter_id', user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('investigation_votes_2025_11_16_17_00')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('investigation_votes_2025_11_16_17_00')
          .insert({
            investigation_id: investigationId,
            voter_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;
      }

      fetchInvestigations();
    } catch (error: any) {
      toast({
        title: "Erro ao votar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { label: 'Mestre', color: 'bg-purple-500' };
    if (level >= 5) return { label: 'Experiente', color: 'bg-blue-500' };
    if (level >= 3) return { label: 'Investigador', color: 'bg-green-500' };
    return { label: 'Novato', color: 'bg-gray-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-background to-green-900/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">{story.title}</h1>
              <p className="text-sm text-muted-foreground">
                Por {story.profiles_2025_11_16_17_00?.username} • {formatDate(story.created_at)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Story Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Details */}
            <Card className="supernatural-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={story.profiles_2025_11_16_17_00?.avatar_url} />
                      <AvatarFallback>
                        {story.profiles_2025_11_16_17_00?.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{story.profiles_2025_11_16_17_00?.username}</h3>
                      <Badge variant="outline" className={getLevelBadge(story.profiles_2025_11_16_17_00?.level || 1).color}>
                        {getLevelBadge(story.profiles_2025_11_16_17_00?.level || 1).label}
                      </Badge>
                    </div>
                  </div>
                  {story.is_verified && (
                    <Badge className="bg-green-500">Verificado</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {story.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {story.location}
                    </div>
                  )}
                  {story.date_occurred && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(story.date_occurred).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {story.credibility_score} pontos
                  </div>
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-1" />
                    {story.investigation_count} investigações
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{story.content}</p>
                </div>

                {/* Media */}
                {story.image_urls && story.image_urls.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Evidências Visuais</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {story.image_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Evidência ${index + 1}`}
                          className="rounded-lg object-cover w-full h-32 hover:scale-105 transition-transform cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {story.video_urls && story.video_urls.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Vídeos</h4>
                    <div className="space-y-4">
                      {story.video_urls.map((url, index) => (
                        <video
                          key={index}
                          src={url}
                          controls
                          className="w-full rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Investigations */}
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Investigações da Comunidade
                </CardTitle>
                <CardDescription>
                  Teorias e evidências compartilhadas pelos investigadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add Investigation */}
                  <div className="space-y-4 p-4 border border-border/50 rounded-lg">
                    <h4 className="font-semibold">Compartilhar Teoria</h4>
                    <Textarea
                      placeholder="Qual é sua teoria sobre este caso? Compartilhe suas ideias..."
                      value={newInvestigation}
                      onChange={(e) => setNewInvestigation(e.target.value)}
                      rows={3}
                    />
                    <Textarea
                      placeholder="Evidências ou observações adicionais (opcional)"
                      value={newEvidence}
                      onChange={(e) => setNewEvidence(e.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={submitInvestigation}
                      disabled={!newInvestigation.trim() || submitting}
                      className="supernatural-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {submitting ? "Adicionando..." : "Adicionar Investigação"}
                    </Button>
                  </div>

                  {/* Investigations List */}
                  {investigations.length > 0 ? (
                    <div className="space-y-4">
                      {investigations.map((investigation) => (
                        <div key={investigation.id} className="p-4 border border-border/50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={investigation.profiles_2025_11_16_17_00?.avatar_url} />
                                <AvatarFallback>
                                  {investigation.profiles_2025_11_16_17_00?.username[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{investigation.profiles_2025_11_16_17_00?.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(investigation.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => voteInvestigation(investigation.id, 1)}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium">{investigation.votes}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => voteInvestigation(investigation.id, -1)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm">{investigation.theory}</p>
                            {investigation.evidence && (
                              <div className="p-2 bg-muted/50 rounded text-sm">
                                <strong>Evidências:</strong> {investigation.evidence}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma investigação ainda. Seja o primeiro a compartilhar uma teoria!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Adicione um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                      />
                      <Button
                        onClick={submitComment}
                        disabled={!newComment.trim() || submitting}
                        size="sm"
                        className="supernatural-button"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Comments List */}
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.profiles_2025_11_16_17_00?.avatar_url} />
                            <AvatarFallback>
                              {comment.profiles_2025_11_16_17_00?.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-sm">{comment.profiles_2025_11_16_17_00?.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </p>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Story Stats */}
              <Card className="supernatural-card">
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credibilidade</span>
                    <Badge variant="secondary">{story.credibility_score}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Investigações</span>
                    <Badge variant="secondary">{investigations.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Comentários</span>
                    <Badge variant="secondary">{comments.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <Badge variant="outline">{story.category}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Author Info */}
              <Card className="supernatural-card">
                <CardHeader>
                  <CardTitle className="text-lg">Sobre o Autor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={story.profiles_2025_11_16_17_00?.avatar_url} />
                      <AvatarFallback>
                        {story.profiles_2025_11_16_17_00?.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{story.profiles_2025_11_16_17_00?.username}</p>
                      <Badge variant="outline" className={getLevelBadge(story.profiles_2025_11_16_17_00?.level || 1).color}>
                        Nível {story.profiles_2025_11_16_17_00?.level}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Membro da comunidade desde {formatDate(story.created_at)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}