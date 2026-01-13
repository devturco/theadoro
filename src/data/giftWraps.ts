export interface GiftWrap {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
}

export const GIFT_WRAPS: GiftWrap[] = [
    {
        id: 'classic_red',
        name: 'Clássico Vermelho',
        description: 'Papel de presente vermelho clássico com laço dourado.',
        price: 5.90,
        image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'minimalist_craft',
        name: 'Kraft Minimalista',
        description: 'Papel kraft ecológico com barbante rústico e ramo de flores secas.',
        price: 3.90,
        image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'premium_box',
        name: 'Caixa Premium TheAdoro',
        description: 'Caixa rígida preta com logo em hot stamping dourado e laço de cetim.',
        price: 15.90,
        image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5af8?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'kids_fun',
        name: 'Infantil Divertido',
        description: 'Papel colorido com estampas de bichinhos e laço colorido.',
        price: 6.90,
        image_url: 'https://images.unsplash.com/photo-1628149811808-3606992d4f20?q=80&w=300&auto=format&fit=crop'
    }
];
