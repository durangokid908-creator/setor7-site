import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Plus, 
  Search, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle, 
  ThumbsUp,
  Award,
  Star,
  Calendar,
  MapPin,
  Filter,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import CreateStoryDialog from './CreateStoryDialog';
import StoryDetail from './StoryDetail';
import AdminPanel from './AdminPanel';

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

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  points: number;
  level: number;
  is_admin: boolean;
  is_banned: boolean;
}

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'todos', label: 'Todas as Categorias' },
    { value: 'fantasmas', label: '👻 Fantasmas' },
    { value: 'assombracao', label: '🏚️ Assombrações' },
    { value: 'ovni', label: '🛸 OVNIs' },
    { value: 'criatura', label: '🐺 Criaturas' },
    { value: 'paranormal', label: '🔮 Paranormal' },
    { value: 'outros', label: '❓ Outros' }
  ];

  useEffect(() => {
    fetchProfile();
    fetchStories();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_2025_11_16_17_00')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories_2025_11_16_17_00')
        .select(`
          *,
          profiles_2025_11_16_17_00 (
            username,
            avatar_url,
            level
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar relatos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || story.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { label: 'Investigador Mestre', color: 'bg-purple-500' };
    if (level >= 5) return { label: 'Investigador Experiente', color: 'bg-blue-500' };
    if (level >= 3) return { label: 'Investigador', color: 'bg-green-500' };
    return { label: 'Novato', color: 'bg-gray-500' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (showAdminPanel) {
    return (
      <AdminPanel 
        user={user} 
        onBack={() => setShowAdminPanel(false)}
      />
    );
  }

  if (selectedStory) {
    return (
      <StoryDetail 
        story={selectedStory} 
        user={user} 
        onBack={() => setSelectedStory(null)}
        onStoryUpdate={fetchStories}
      />
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
                  Setor 7
                </h1>
                <p className="text-sm text-muted-foreground">Comunidade de Investigadores</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{profile.username}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={getLevelBadge(profile.level).color}>
                        {getLevelBadge(profile.level).label}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{profile.points}</span>
                      </div>
                    </div>
                  </div>
                  <Avatar>
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              {profile?.is_admin && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdminPanel(true)}
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="supernatural-card">
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full supernatural-button" 
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Relato
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Comunidade
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    Ranking
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="supernatural-card">
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Relatos</span>
                    <Badge variant="secondary">{stories.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Investigadores</span>
                    <Badge variant="secondary">
                      {new Set(stories.map(s => s.author_id)).size}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Casos Verificados</span>
                    <Badge variant="secondary" className="bg-green-500">
                      {stories.filter(s => s.is_verified).length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="supernatural-card mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar relatos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stories Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="supernatural-card animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStories.map((story) => (
                  <Card 
                    key={story.id} 
                    className="supernatural-card hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setSelectedStory(story)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                          <CardDescription className="flex items-center space-x-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={story.profiles_2025_11_16_17_00?.avatar_url} />
                              <AvatarFallback>
                                {story.profiles_2025_11_16_17_00?.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{story.profiles_2025_11_16_17_00?.username}</span>
                            <Badge variant="outline" className={getLevelBadge(story.profiles_2025_11_16_17_00?.level || 1).color}>
                              Nv.{story.profiles_2025_11_16_17_00?.level}
                            </Badge>
                          </CardDescription>
                        </div>
                        {story.is_verified && (
                          <Badge className="bg-green-500">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {story.content}
                      </p>
                      
                      <div className="space-y-3">
                        {story.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {story.location}
                          </div>
                        )}
                        
                        {story.date_occurred && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(story.date_occurred)}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {story.credibility_score}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {story.investigation_count}
                            </div>
                          </div>
                          
                          <Badge variant="outline">
                            {categories.find(c => c.value === story.category)?.label.split(' ')[1] || story.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredStories.length === 0 && !loading && (
              <Card className="supernatural-card">
                <CardContent className="text-center py-12">
                  <Ghost className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum relato encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || categoryFilter !== 'todos' 
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Seja o primeiro a compartilhar uma experiência sobrenatural!'}
                  </p>
                  <Button 
                    className="supernatural-button" 
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Relato
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CreateStoryDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onStoryCreated={fetchStories}
        user={user}
      />
    </div>
  );
}