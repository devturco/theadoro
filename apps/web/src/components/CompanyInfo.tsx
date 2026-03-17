import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Mail, Phone, MapPin, Clock, Users, Award } from 'lucide-react';

interface CompanyInfoProps {
  variant?: 'contact' | 'about' | 'full';
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ variant = 'full' }) => {
  const contactInfo = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-wine/10 p-2 rounded-lg">
          <Mail className="h-5 w-5 text-wine" />
        </div>
        <div>
          <p className="font-medium text-graphite">E-mail</p>
          <p className="text-gray-600">contato@theadoro.com.br</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-wine/10 p-2 rounded-lg">
          <Phone className="h-5 w-5 text-wine" />
        </div>
        <div>
          <p className="font-medium text-graphite">Telefone</p>
          <p className="text-gray-600">(11) 9999-9999</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-wine/10 p-2 rounded-lg">
          <MapPin className="h-5 w-5 text-wine" />
        </div>
        <div>
          <p className="font-medium text-graphite">Endereço</p>
          <p className="text-gray-600">São Paulo, SP - Brasil</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-wine/10 p-2 rounded-lg">
          <Clock className="h-5 w-5 text-wine" />
        </div>
        <div>
          <p className="font-medium text-graphite">Horário de Atendimento</p>
          <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
          <p className="text-gray-600">Sábado: 9h às 14h</p>
        </div>
      </div>
    </div>
  );

  const aboutInfo = (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-graphite mb-4">THEADORO Gift</h3>
        <p className="text-gray-600 leading-relaxed">
          O marketplace premium que conecta você a vendedores excepcionais, 
          presentes únicos e experiências inesquecíveis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="bg-wine/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Users className="h-8 w-8 text-wine" />
          </div>
          <h4 className="font-semibold text-graphite mb-2">1000+</h4>
          <p className="text-sm text-gray-600">Vendedores Parceiros</p>
        </div>
        
        <div className="text-center">
          <div className="bg-wine/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Award className="h-8 w-8 text-wine" />
          </div>
          <h4 className="font-semibold text-graphite mb-2">50.000+</h4>
          <p className="text-sm text-gray-600">Produtos Únicos</p>
        </div>
        
        <div className="text-center">
          <div className="bg-wine/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-8 w-8 text-wine" />
          </div>
          <h4 className="font-semibold text-graphite mb-2">100+</h4>
          <p className="text-sm text-gray-600">Cidades Atendidas</p>
        </div>
      </div>
    </div>
  );

  if (variant === 'contact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-graphite">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent>
          {contactInfo}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'about') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-graphite">Sobre a THEADORO</CardTitle>
        </CardHeader>
        <CardContent>
          {aboutInfo}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-graphite">Sobre a THEADORO</CardTitle>
        </CardHeader>
        <CardContent>
          {aboutInfo}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-graphite">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent>
          {contactInfo}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyInfo;