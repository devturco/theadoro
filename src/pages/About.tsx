import React from 'react';
import { Heart, Users, Award, MapPin, Mail, Phone } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Sobre a THEADORO
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Conectando corações através de presentes únicos e experiências inesquecíveis
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
              Nossa História
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20gift%20store%20interior%20with%20beautiful%20presents%20and%20flowers%20warm%20lighting%20cozy%20atmosphere&image_size=landscape_4_3"
                  alt="Loja THEADORO"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  A THEADORO nasceu em 2020 com uma missão simples: tornar cada momento especial 
                  ainda mais memorável através de presentes únicos e experiências personalizadas.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Começamos como uma pequena loja de presentes em São Paulo e evoluímos para 
                  um marketplace digital que conecta pessoas apaixonadas por criar momentos 
                  especiais com vendedores talentosos de todo o Brasil.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Hoje, somos uma plataforma que celebra a arte de presentear, oferecendo 
                  desde produtos artesanais únicos até experiências inesquecíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Nossos Valores
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Missão */}
            <div className="text-center p-8 rounded-lg bg-pink-50 border border-pink-100">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Missão</h3>
              <p className="text-gray-700 leading-relaxed">
                Conectar pessoas através de presentes únicos e experiências memoráveis, 
                facilitando a expressão de amor, carinho e gratidão.
              </p>
            </div>

            {/* Visão */}
            <div className="text-center p-8 rounded-lg bg-purple-50 border border-purple-100">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Visão</h3>
              <p className="text-gray-700 leading-relaxed">
                Ser a principal plataforma de presentes e experiências do Brasil, 
                reconhecida pela qualidade, inovação e impacto positivo na vida das pessoas.
              </p>
            </div>

            {/* Valores */}
            <div className="text-center p-8 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Valores</h3>
              <ul className="text-gray-700 leading-relaxed text-left space-y-2">
                <li>• Autenticidade e originalidade</li>
                <li>• Qualidade em cada detalhe</li>
                <li>• Sustentabilidade e responsabilidade</li>
                <li>• Inovação constante</li>
                <li>• Relacionamentos duradouros</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Números da THEADORO */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            THEADORO em Números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-lg opacity-90">Presentes Entregues</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">1.2K+</div>
              <div className="text-lg opacity-90">Vendedores Parceiros</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">25K+</div>
              <div className="text-lg opacity-90">Clientes Felizes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-lg opacity-90">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Nossa Equipe */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Nossa Equipe
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* CEO */}
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <img 
                src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20woman%20CEO%20portrait%20confident%20smile%20modern%20office%20background&image_size=square"
                alt="Ana Silva - CEO"
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
              <h3 className="text-xl font-bold mb-2 text-gray-800">Ana Silva</h3>
              <p className="text-pink-600 font-semibold mb-4">CEO &amp; Fundadora</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Empreendedora apaixonada por conectar pessoas através de experiências únicas. 
                15 anos de experiência em e-commerce e marketplace.
              </p>
            </div>

            {/* CTO */}
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <img 
                src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20man%20CTO%20portrait%20confident%20smile%20tech%20background&image_size=square"
                alt="Carlos Santos - CTO"
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
              <h3 className="text-xl font-bold mb-2 text-gray-800">Carlos Santos</h3>
              <p className="text-purple-600 font-semibold mb-4">CTO</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Especialista em tecnologia e inovação digital. Responsável por toda a 
                infraestrutura tecnológica que torna a THEADORO possível.
              </p>
            </div>

            {/* Head of Marketing */}
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <img 
                src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20woman%20marketing%20director%20portrait%20creative%20background&image_size=square"
                alt="Mariana Costa - Head of Marketing"
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
              <h3 className="text-xl font-bold mb-2 text-gray-800">Mariana Costa</h3>
              <p className="text-blue-600 font-semibold mb-4">Head of Marketing</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Especialista em marketing digital e experiência do cliente. Garante que 
                cada interação com a THEADORO seja especial e memorável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Localização e Contato */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Onde Estamos
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Mapa/Localização */}
            <div>
              <div className="bg-gray-100 rounded-lg p-8 h-80 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">Sede THEADORO</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Rua das Flores, 123<br />
                    Vila Madalena - São Paulo/SP<br />
                    CEP: 05435-000
                  </p>
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Entre em Contato</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-gray-600">contato@theadoro.com.br</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Telefone</p>
                      <p className="text-gray-600">(11) 3456-7890</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Atendimento</p>
                      <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-100">
                <h4 className="text-lg font-bold mb-3 text-gray-800">Quer ser um Vendedor Parceiro?</h4>
                <p className="text-gray-600 mb-4">
                  Junte-se à nossa comunidade de vendedores e alcance milhares de clientes 
                  que buscam presentes únicos e especiais.
                </p>
                <button className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                  Saiba Mais
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;