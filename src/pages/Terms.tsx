import React from 'react';
import { FileText, Shield, Users, CreditCard, Truck, AlertTriangle } from 'lucide-react';

const Terms: React.FC = () => {
  const sections = [
    {
      id: 'definicoes',
      title: '1. Definições',
      icon: FileText,
      content: [
        'THEADORO: Plataforma digital de marketplace especializada em presentes e experiências.',
        'Usuário: Qualquer pessoa que acesse ou utilize a plataforma THEADORO.',
        'Vendedor: Pessoa física ou jurídica que oferece produtos ou serviços através da plataforma.',
        'Comprador: Usuário que adquire produtos ou serviços através da plataforma.',
        'Produto: Qualquer item físico ou digital oferecido para venda na plataforma.',
        'Serviço: Qualquer experiência ou prestação de serviço oferecida através da plataforma.'
      ]
    },
    {
      id: 'aceitacao',
      title: '2. Aceitação dos Termos',
      icon: Shield,
      content: [
        'Ao acessar e utilizar a plataforma THEADORO, você concorda integralmente com estes Termos de Uso.',
        'Caso não concorde com qualquer disposição destes termos, você deve interromper imediatamente o uso da plataforma.',
        'Reservamo-nos o direito de modificar estes termos a qualquer momento, sendo as alterações comunicadas através da plataforma.',
        'O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.'
      ]
    },
    {
      id: 'cadastro',
      title: '3. Cadastro e Conta do Usuário',
      icon: Users,
      content: [
        'Para utilizar determinadas funcionalidades, é necessário criar uma conta fornecendo informações verdadeiras e atualizadas.',
        'Você é responsável por manter a confidencialidade de suas credenciais de acesso.',
        'É vedado criar múltiplas contas ou utilizar informações falsas no cadastro.',
        'A THEADORO reserva-se o direito de suspender ou cancelar contas que violem estes termos.',
        'Usuários menores de 18 anos devem ter autorização dos responsáveis legais.'
      ]
    },
    {
      id: 'vendedores',
      title: '4. Vendedores e Produtos',
      icon: Users,
      content: [
        'Vendedores devem fornecer informações precisas sobre seus produtos e serviços.',
        'É responsabilidade do vendedor manter estoque atualizado e cumprir prazos de entrega.',
        'Produtos devem estar em conformidade com a legislação brasileira e não podem ser ilegais ou prejudiciais.',
        'A THEADORO não se responsabiliza pela qualidade dos produtos, sendo esta responsabilidade exclusiva do vendedor.',
        'Vendedores devem responder a dúvidas e reclamações dos compradores em tempo hábil.',
        'É vedada a venda de produtos falsificados, vencidos ou que violem direitos autorais.'
      ]
    },
    {
      id: 'compras',
      title: '5. Compras e Pagamentos',
      icon: CreditCard,
      content: [
        'Todas as transações são processadas através de sistemas seguros de pagamento.',
        'Os preços exibidos incluem todos os impostos aplicáveis, exceto quando especificado.',
        'O comprador deve verificar todas as informações antes de finalizar a compra.',
        'A THEADORO atua como intermediadora das transações entre compradores e vendedores.',
        'Estornos e reembolsos seguem as políticas específicas de cada vendedor e da legislação vigente.',
        'Taxas de entrega são de responsabilidade do comprador e calculadas no checkout.'
      ]
    },
    {
      id: 'entrega',
      title: '6. Entrega e Logística',
      icon: Truck,
      content: [
        'Prazos de entrega são estimativas fornecidas pelos vendedores e podem variar.',
        'A responsabilidade pela entrega é do vendedor ou transportadora por ele contratada.',
        'Compradores devem fornecer endereço completo e correto para entrega.',
        'Em caso de problemas na entrega, o comprador deve entrar em contato com o vendedor.',
        'A THEADORO não se responsabiliza por atrasos causados por fatores externos.',
        'Produtos digitais são entregues através da plataforma ou email cadastrado.'
      ]
    },
    {
      id: 'devolucoes',
      title: '7. Trocas e Devoluções',
      icon: AlertTriangle,
      content: [
        'Compradores têm direito ao arrependimento conforme Código de Defesa do Consumidor (7 dias).',
        'Produtos devem ser devolvidos nas mesmas condições em que foram recebidos.',
        'Custos de devolução podem ser de responsabilidade do comprador, conforme política do vendedor.',
        'Produtos personalizados ou perecíveis podem não ser elegíveis para devolução.',
        'Serviços já prestados não são elegíveis para devolução, salvo defeito na prestação.',
        'Reembolsos são processados conforme meio de pagamento original em até 10 dias úteis.'
      ]
    },
    {
      id: 'propriedade',
      title: '8. Propriedade Intelectual',
      icon: Shield,
      content: [
        'Todo conteúdo da plataforma THEADORO é protegido por direitos autorais.',
        'Vendedores garantem ter direitos sobre imagens e descrições de seus produtos.',
        'É vedado copiar, reproduzir ou distribuir conteúdo da plataforma sem autorização.',
        'Marcas, logos e nomes comerciais são propriedade de seus respectivos donos.',
        'Usuários concedem à THEADORO licença para usar conteúdo enviado conforme necessário para operação da plataforma.'
      ]
    },
    {
      id: 'responsabilidades',
      title: '9. Limitação de Responsabilidade',
      icon: AlertTriangle,
      content: [
        'A THEADORO atua como intermediadora e não se responsabiliza por produtos ou serviços oferecidos por terceiros.',
        'Não garantimos disponibilidade ininterrupta da plataforma.',
        'Usuários utilizam a plataforma por sua própria conta e risco.',
        'Nossa responsabilidade é limitada ao valor da transação específica.',
        'Não nos responsabilizamos por danos indiretos, lucros cessantes ou danos morais.',
        'Vendedores são inteiramente responsáveis por seus produtos, serviços e relacionamento com compradores.'
      ]
    },
    {
      id: 'proibicoes',
      title: '10. Condutas Proibidas',
      icon: AlertTriangle,
      content: [
        'Usar a plataforma para atividades ilegais ou fraudulentas.',
        'Enviar spam, vírus ou qualquer código malicioso.',
        'Violar direitos de propriedade intelectual de terceiros.',
        'Criar avaliações falsas ou manipular sistema de reputação.',
        'Assediar, ameaçar ou discriminar outros usuários.',
        'Tentar acessar áreas restritas da plataforma ou dados de outros usuários.',
        'Usar informações de outros usuários para fins não autorizados.'
      ]
    },
    {
      id: 'suspensao',
      title: '11. Suspensão e Cancelamento',
      icon: Shield,
      content: [
        'Podemos suspender ou cancelar contas que violem estes termos.',
        'Usuários podem cancelar suas contas a qualquer momento.',
        'Em caso de suspensão, o usuário será notificado sobre os motivos.',
        'Dados pessoais serão tratados conforme nossa Política de Privacidade após cancelamento.',
        'Transações pendentes serão finalizadas conforme acordado antes do cancelamento.'
      ]
    },
    {
      id: 'legislacao',
      title: '12. Lei Aplicável e Foro',
      icon: FileText,
      content: [
        'Estes termos são regidos pela legislação brasileira.',
        'Questões relacionadas ao Código de Defesa do Consumidor têm precedência.',
        'Foro competente é o da comarca de São Paulo/SP.',
        'Em caso de conflito entre versões em diferentes idiomas, prevalece a versão em português.',
        'Disposições inválidas não afetam a validade dos demais termos.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Termos de Uso
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Leia atentamente nossos termos de uso para entender seus direitos e responsabilidades ao utilizar a plataforma THEADORO.
          </p>
          <div className="mt-8 text-sm opacity-90">
            <p>Última atualização: Janeiro de 2024</p>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Índice</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <section.icon className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                  {section.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">Bem-vindo à THEADORO</h2>
              <p className="text-blue-700 leading-relaxed">
                Estes Termos de Uso estabelecem as regras e condições para utilização da plataforma 
                THEADORO, um marketplace especializado em presentes e experiências únicas. 
                Ao utilizar nossos serviços, você concorda em cumprir estes termos integralmente.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="space-y-12">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-20">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {section.title}
                    </h2>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <ul className="space-y-4">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700 leading-relaxed">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="mt-16 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Dúvidas sobre os Termos?</h3>
              <p className="text-gray-700 mb-4">
                Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> juridico@theadoro.com.br</p>
                <p><strong>Telefone:</strong> (11) 3456-7890</p>
                <p><strong>Endereço:</strong> Rua das Flores, 123 - Vila Madalena - São Paulo/SP</p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Aviso Legal</h4>
                  <p className="text-yellow-700 text-sm leading-relaxed">
                    Estes termos podem ser atualizados periodicamente. Recomendamos que você 
                    revise esta página regularmente para se manter informado sobre quaisquer alterações. 
                    O uso continuado da plataforma após modificações constitui aceitação dos novos termos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;