-- Insert sample data for demonstration
-- Note: These are fictional stories for demonstration purposes

-- Sample stories
INSERT INTO public.stories_2025_11_16_17_00 (
  title, 
  content, 
  location, 
  date_occurred, 
  category, 
  author_id,
  image_urls,
  credibility_score,
  investigation_count
) VALUES 
(
  'A Dama de Branco da Estrada Velha',
  'Era uma noite chuvosa de outubro quando eu dirigia pela estrada velha que liga minha cidade ao interior. Por volta das 2h da manhã, vi uma figura feminina vestida de branco caminhando na beira da estrada. Parei para oferecer ajuda, mas quando abri a janela para falar com ela, simplesmente não havia mais ninguém lá. O mais estranho é que não havia lugar para ela se esconder - era uma reta longa e sem vegetação. Pesquisei depois e descobri que várias pessoas já relataram avistamentos similares nessa mesma estrada.',
  'Estrada Rural, Interior de São Paulo',
  '2024-10-15',
  'fantasmas',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['/images/supernatural_atmosphere_1.jpeg'],
  15,
  3
),
(
  'Luzes Estranhas no Céu Noturno',
  'Estava no quintal de casa por volta das 23h quando notei três luzes brilhantes formando um triângulo perfeito no céu. Elas permaneceram imóveis por cerca de 10 minutos, depois começaram a se mover em formação, fazendo manobras impossíveis para qualquer aeronave conhecida. Tentei filmar com o celular, mas as luzes desapareceram assim que peguei o telefone. Meus vizinhos também viram e ficaram igualmente intrigados.',
  'Zona Rural, Minas Gerais',
  '2024-11-01',
  'ovni',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['/images/supernatural_atmosphere_2.webp'],
  12,
  2
),
(
  'A Casa que Sussurrava',
  'Mudei para uma casa antiga no centro histórico da cidade. Desde o primeiro dia, ouço sussurros vindos das paredes, principalmente durante a madrugada. Não consigo entender o que dizem, mas parecem conversas entre várias pessoas. Já verifiquei toda a instalação elétrica e hidráulica, mas não encontrei explicação. O mais perturbador é que às vezes sinto como se alguém estivesse me observando, mesmo estando sozinho em casa.',
  'Centro Histórico, Salvador, BA',
  '2024-09-20',
  'assombracao',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['/images/supernatural_atmosphere_3.jpeg'],
  18,
  5
);

-- Sample investigations
INSERT INTO public.investigations_2025_11_16_17_00 (
  story_id,
  investigator_id,
  theory,
  evidence,
  votes
) VALUES 
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'A Dama de Branco da Estrada Velha' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Pode ser um fenômeno conhecido como "auto-sugestão" combinado com condições climáticas específicas. A chuva e a neblina podem criar ilusões ópticas, especialmente em estradas mal iluminadas.',
  'Pesquisei e essa estrada tem histórico de acidentes fatais. Fenômenos similares são relatados em locais com trauma emocional coletivo.',
  8
),
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'Luzes Estranhas no Céu Noturno' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Possível atividade militar não divulgada ou teste de drones experimentais. A formação triangular é comum em aeronaves militares stealth.',
  'Verifiquei e há uma base aérea a 50km da região. Testes noturnos são comuns para evitar detecção.',
  5
),
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'A Casa que Sussurrava' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Casas antigas podem ter problemas estruturais que causam sons estranhos. Expansão e contração de materiais, ventos em cavidades ocultas, ou até mesmo pequenos animais nas paredes.',
  'Recomendo uma inspeção detalhada por um engenheiro estrutural e um especialista em acústica.',
  12
);

-- Sample comments
INSERT INTO public.comments_2025_11_16_17_00 (
  story_id,
  author_id,
  content
) VALUES 
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'A Dama de Branco da Estrada Velha' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Experiência muito similar aconteceu comigo na mesma região! Será que é o mesmo fenômeno?'
),
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'Luzes Estranhas no Céu Noturno' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Conseguiu fazer algum registro? Mesmo que não tenha filmado na hora, talvez tenha câmeras de segurança na região.'
),
(
  (SELECT id FROM public.stories_2025_11_16_17_00 WHERE title = 'A Casa que Sussurrava' LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Que assustador! Já tentou gravar os sussurros? Seria interessante analisar o áudio.'
);