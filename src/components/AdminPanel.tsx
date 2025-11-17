import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Trash2, 
  Ban, 
  UserCheck, 
  UserX, 
  Crown,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Story {
  id: string;
  title: string;
  content: string;
  location: string;
  category: string;
  author_id: string;
  is_deleted: boolean;
  created_at: string;
  profiles_2025_11_16_17_00: {
    username: string;
    avatar_url: string;
    is_banned: boolean;
  };
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_admin: boolean;
  is_banned: boolean;
  banned_at: string;
  ban_reason: string;
  points: number;
  level: number;
  created_at: string;
}

interface AdminLog {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  admin_id: string;
  target_user_id: string;
  profiles_2025_11_16_17_00: {
    username: string;
  };
}

interface AdminPanelProps {
  user: User;
  onBack: () => void;
}

export default function AdminPanel({ user, onBack }: AdminPanelProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStories(),
        fetchUsers(),
        fetchAdminLogs()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories_2025_11_16_17_00')
      .select(`
        *,
        profiles_2025_11_16_17_00 (
          username,
          avatar_url,
          is_banned
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setStories(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles_2025_11_16_17_00')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const fetchAdminLogs = async () => {
    const { data, error } = await supabase
      .from('admin_logs_2025_11_16_17_00')
      .select(`
        *,
        profiles_2025_11_16_17_00 (
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setAdminLogs(data || []);
  };

  const deleteStory = async (storyId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('stories_2025_11_16_17_00')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          delete_reason: reason
        })
        .eq('id', storyId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs_2025_11_16_17_00')
        .insert({
          admin_id: user.id,
          action_type: 'delete_story',
          target_story_id: storyId,
          reason: reason
        });

      toast({
        title: "Post deletado",
        description: "O post foi removido com sucesso.",
      });

      fetchStories();
      setDeleteReason('');
    } catch (error: any) {
      toast({
        title: "Erro ao deletar post",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles_2025_11_16_17_00')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: user.id,
          ban_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs_2025_11_16_17_00')
        .insert({
          admin_id: user.id,
          action_type: 'ban_user',
          target_user_id: userId,
          reason: reason
        });

      toast({
        title: "Usuário banido",
        description: "O usuário foi banido com sucesso.",
      });

      fetchUsers();
      setBanReason('');
    } catch (error: any) {
      toast({
        title: "Erro ao banir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles_2025_11_16_17_00')
        .update({
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs_2025_11_16_17_00')
        .insert({
          admin_id: user.id,
          action_type: 'unban_user',
          target_user_id: userId,
          reason: 'Usuário desbanido'
        });

      toast({
        title: "Usuário desbanido",
        description: "O usuário foi desbanido com sucesso.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao desbanir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const promoteToAdmin = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('make_first_admin_2025_11_16_17_00', {
        user_email: email
      });

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs_2025_11_16_17_00')
        .insert({
          admin_id: user.id,
          action_type: 'promote_admin',
          reason: `Promovido usuário com email: ${email}`
        });

      toast({
        title: "Usuário promovido",
        description: "O usuário foi promovido a administrador.",
      });

      fetchUsers();
      setPromoteEmail('');
    } catch (error: any) {
      toast({
        title: "Erro ao promover usuário",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-background to-green-900/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary supernatural-glow" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                  Setor 7 - Painel Admin
                </h1>
                <p className="text-sm text-muted-foreground">Sistema de Moderação</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={onBack}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stories">Posts</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="promote">Promover Admin</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Stories Management */}
          <TabsContent value="stories" className="space-y-6">
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Gerenciar Posts ({stories.length})
                </CardTitle>
                <CardDescription>
                  Modere o conteúdo da comunidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className={`p-4 border rounded-lg ${story.is_deleted ? 'bg-red-900/20 border-red-500/50' : 'border-border/50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{story.title}</h3>
                            {story.is_deleted && (
                              <Badge variant="destructive">Deletado</Badge>
                            )}
                            {story.profiles_2025_11_16_17_00?.is_banned && (
                              <Badge variant="outline" className="bg-red-500">Autor Banido</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {story.content}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Por: {story.profiles_2025_11_16_17_00?.username}</span>
                            <span>Categoria: {story.category}</span>
                            <span>{formatDate(story.created_at)}</span>
                          </div>
                        </div>
                        
                        {!story.is_deleted && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deletar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deletar Post</DialogTitle>
                                <DialogDescription>
                                  Esta ação não pode ser desfeita. O post será marcado como deletado.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="deleteReason">Motivo da exclusão</Label>
                                  <Textarea
                                    id="deleteReason"
                                    placeholder="Descreva o motivo da exclusão..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteStory(story.id, deleteReason)}
                                    disabled={!deleteReason.trim()}
                                  >
                                    Confirmar Exclusão
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Gerenciar Usuários ({users.length})
                </CardTitle>
                <CardDescription>
                  Modere os membros da comunidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((profile) => (
                    <div key={profile.id} className={`p-4 border rounded-lg ${profile.is_banned ? 'bg-red-900/20 border-red-500/50' : 'border-border/50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{profile.username}</p>
                              {profile.is_admin && (
                                <Badge className="bg-purple-500">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              {profile.is_banned && (
                                <Badge variant="destructive">Banido</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {profile.full_name} • Nível {profile.level} • {profile.points} pontos
                            </p>
                            {profile.is_banned && profile.ban_reason && (
                              <p className="text-xs text-red-400 mt-1">
                                Motivo: {profile.ban_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {profile.is_banned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unbanUser(profile.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Desbanir
                            </Button>
                          ) : (
                            profile.id !== user.id && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Ban className="h-4 w-4 mr-2" />
                                    Banir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Banir Usuário</DialogTitle>
                                    <DialogDescription>
                                      O usuário será impedido de criar conteúdo na plataforma.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="banReason">Motivo do banimento</Label>
                                      <Textarea
                                        id="banReason"
                                        placeholder="Descreva o motivo do banimento..."
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => banUser(profile.id, banReason)}
                                        disabled={!banReason.trim()}
                                      >
                                        Confirmar Banimento
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promote Admin */}
          <TabsContent value="promote" className="space-y-6">
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  Promover Administrador
                </CardTitle>
                <CardDescription>
                  Conceda privilégios administrativos a outros usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="promoteEmail">Email do usuário</Label>
                    <Input
                      id="promoteEmail"
                      type="email"
                      placeholder="usuario@email.com"
                      value={promoteEmail}
                      onChange={(e) => setPromoteEmail(e.target.value)}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="supernatural-button"
                        disabled={!promoteEmail.trim()}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Promover a Admin
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Promoção</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja promover este usuário a administrador? 
                          Ele terá acesso total ao painel de moderação.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => promoteToAdmin(promoteEmail)}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="supernatural-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Logs de Administração
                </CardTitle>
                <CardDescription>
                  Histórico de ações administrativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="p-4 border border-border/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {log.profiles_2025_11_16_17_00?.username} - {log.action_type}
                          </p>
                          {log.reason && (
                            <p className="text-sm text-muted-foreground">{log.reason}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}