import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated: () => void;
  user: User;
}

export default function CreateStoryDialog({ open, onOpenChange, onStoryCreated, user }: CreateStoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [category, setCategory] = useState('outros');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const { toast } = useToast();

  const categories = [
    { value: 'fantasmas', label: '👻 Fantasmas' },
    { value: 'assombracao', label: '🏚️ Assombrações' },
    { value: 'ovni', label: '🛸 OVNIs' },
    { value: 'criatura', label: '🐺 Criaturas' },
    { value: 'paranormal', label: '🔮 Paranormal' },
    { value: 'outros', label: '❓ Outros' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (uploadedImages.length + imageFiles.length > 5) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 5 imagens por relato.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedImages(prev => [...prev, ...imageFiles]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (uploadedVideos.length + videoFiles.length > 2) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 2 vídeos por relato.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedVideos(prev => [...prev, ...videoFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('story-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('story-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const image of uploadedImages) {
        const url = await uploadFile(image, 'images');
        imageUrls.push(url);
      }

      // Upload videos
      const videoUrls: string[] = [];
      for (const video of uploadedVideos) {
        const url = await uploadFile(video, 'videos');
        videoUrls.push(url);
      }

      // Create story
      const { error } = await supabase
        .from('stories_2025_11_16_17_00')
        .insert({
          title,
          content,
          location: location || null,
          date_occurred: dateOccurred || null,
          category,
          author_id: user.id,
          image_urls: imageUrls,
          video_urls: videoUrls
        });

      if (error) throw error;

      toast({
        title: "Relato criado!",
        description: "Seu relato foi publicado com sucesso.",
      });

      // Reset form
      setTitle('');
      setContent('');
      setLocation('');
      setDateOccurred('');
      setCategory('outros');
      setUploadedImages([]);
      setUploadedVideos([]);
      
      onStoryCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar relato",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto supernatural-card">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Novo Relatório - Setor 7
          </DialogTitle>
          <DialogDescription>
            Documente sua experiência para a base de dados
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Relato *</Label>
            <Input
              id="title"
              placeholder="Ex: Aparição no Cemitério da Consolação"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Ex: São Paulo, SP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOccurred">Data do Ocorrido</Label>
              <Input
                id="dateOccurred"
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Relato Completo *</Label>
            <Textarea
              id="content"
              placeholder="Descreva detalhadamente sua experiência sobrenatural..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <Label>Imagens (máximo 5)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((image, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-2">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {uploadedImages.length < 5 && (
                <Card className="border-dashed border-2 hover:border-primary transition-colors">
                  <CardContent className="p-2">
                    <label className="flex flex-col items-center justify-center h-20 cursor-pointer">
                      <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Adicionar</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-4">
            <Label>Vídeos (máximo 2)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedVideos.map((video, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span className="text-sm truncate">{video.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {uploadedVideos.length < 2 && (
                <Card className="border-dashed border-2 hover:border-primary transition-colors">
                  <CardContent className="p-2">
                    <label className="flex flex-col items-center justify-center h-16 cursor-pointer">
                      <Video className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Adicionar Vídeo</span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="supernatural-button"
              disabled={loading}
            >
              {loading ? "Publicando..." : "Publicar Relato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}