
import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsappButton = () => {
  const phoneNumber = "56944366510";
  const message = encodeURIComponent("Hola, tengo una consulta sobre Venta POS");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  
  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center"
      aria-label="Contáctanos por WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default WhatsappButton;
