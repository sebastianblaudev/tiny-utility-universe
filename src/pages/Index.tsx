import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import WhatsappButton from '@/components/WhatsappButton';
import { 
  ShoppingCart, 
  Search, 
  Mic, 
  Barcode, 
  Clipboard, 
  LineChart, 
  Clock, 
  Tag, 
  Receipt, 
  FileText, 
  QrCode, 
  Users, 
  Image,
  CheckSquare,
  Zap,
  List,
  Heart,
  Headphones,
  ArrowUpRight,
  ChevronRight,
  LogIn,
  Sparkles,
  Gift,
  Percent,
  BadgePercent,
  Star,
  ArrowRight,
  Flame,
  Award,
  Medal,
  Rocket,
  CalendarClock,
  PartyPopper,
  BrainCircuit,
  Package,
  Wallet,
  Printer,
  Truck,
  BarChart3,
  Smartphone,
  Glasses,
  Scan,
  Store,
  Briefcase,
  ShieldCheck,
  Megaphone,
  Lightbulb,
  PiggyBank,
  Layers,
  Settings
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    hours: 6,
    minutes: 59,
    seconds: 38
  });

  const businessTypes = [
    "Ferreterías",
    "Tiendas",
    "Negocios de Comida Rápida",
    "Farmacias",
    "Boutiques",
    "Papelerías",
    "Minimercados"
  ];
  
  const [currentBusinessIndex, setCurrentBusinessIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentBusinessIndex((prevIndex) => (prevIndex + 1) % businessTypes.length);
        setIsAnimating(false);
      }, 200);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        let { hours, minutes, seconds } = prevTime;
        
        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            } else {
              clearInterval(timer);
              return prevTime;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time;
  };

  const features = [
    { 
      icon: <Clipboard size={48} className="text-blue-500" />, 
      title: "Registro de ventas", 
      description: "Registra tus ventas de forma rápida y sencilla"
    },
    { 
      icon: <Mic size={48} className="text-purple-500" />, 
      title: "Búsqueda por Voz", 
      description: "Encuentra productos usando comandos de voz"
    },
    { 
      icon: <Barcode size={48} className="text-indigo-500" />, 
      title: "Búsqueda por Código de Barras", 
      description: "Escanea códigos para una búsqueda instantánea"
    },
    { 
      icon: <Search size={48} className="text-blue-500" />, 
      title: "Búsqueda por Nombre", 
      description: "Localiza productos fácilmente por su nombre"
    },
    { 
      icon: <Tag size={48} className="text-teal-500" />, 
      title: "Precio costo y Margen", 
      description: "Calcula y gestiona tus márgenes de ganancia"
    },
    { 
      icon: <Package size={48} className="text-green-500" />, 
      title: "Control de Inventario", 
      description: "Mantén tu stock actualizado en tiempo real"
    },
    { 
      icon: <FileText size={48} className="text-emerald-500" />, 
      title: "Historial de Ventas", 
      description: "Accede a un registro detallado de tus transacciones"
    },
    { 
      icon: <LineChart size={48} className="text-cyan-500" />, 
      title: "Estadísticas", 
      description: "Analiza el rendimiento de tu negocio con gráficos"
    },
    { 
      icon: <Clock size={48} className="text-blue-500" />, 
      title: "Gestión de Turnos", 
      description: "Administra tus turnos"
    },
    { 
      icon: <Receipt size={48} className="text-purple-500" />, 
      title: "Impresión de comprobantes", 
      description: "Entrega recibos profesionales a tus clientes"
    },
    { 
      icon: <Megaphone size={48} className="text-pink-500" />, 
      title: "Impresión de comandas", 
      description: "Ideal para negocios de comida rápida y cafeterías"
    },
    { 
      icon: <Barcode size={48} className="text-red-500" />, 
      title: "Genera Códigos de Barra", 
      description: "Crea códigos personalizados para tus productos"
    },
    { 
      icon: <Users size={48} className="text-orange-500" />, 
      title: "Registro de Clientes", 
      description: "Gestiona tu base de datos de clientes"
    },
    { 
      icon: <Image size={48} className="text-amber-500" />, 
      title: "Carga imágenes a productos", 
      description: "Visualiza tus productos con imágenes"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <WhatsappButton />
      
      <header className={`sticky top-0 z-50 w-full shadow-sm transition-all duration-300 ${isScrolled ? 'bg-white dark:bg-gray-900' : 'bg-white dark:bg-gray-900'} border-b`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura.PNG-dde30VtfYzHLUdcOvDHgQYHl2z3yfa.png" 
              alt="Logo de Venta POS - Sistema de Punto de Venta" 
              className="h-8 w-auto"
              width="120"
              height="32"
            />
          </div>
          <nav aria-label="Navegación principal">
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')} className="animate-in" variant="default">
                  Dashboard <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="hidden sm:flex">
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="animate-in">
                    <Link to="/register">Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <section aria-labelledby="hero-heading" className="pt-16 pb-24 px-4 relative">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0 animate-in text-center lg:text-left">
              <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Revoluciona tu Negocio con Venta POS
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Sistema de punto de venta moderno, rápido y 100% online.
                Administra tu negocio desde cualquier lugar.
              </p>
              
              <div className="rounded-xl p-6 mb-0 md:mb-8 transform hover:scale-105 transition-all duration-300 w-full">
                <div>
                  <h2 className="text-2xl font-bold mb-1 md:mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Perfecto para:
                  </h2>
                  <div className="min-h-[30px] md:min-h-[40px] flex items-center justify-center lg:justify-start">
                    <span 
                      className={`text-xl md:text-2xl font-semibold transition-all duration-300 ${isAnimating ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
                    >
                      {businessTypes[currentBusinessIndex]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
                <div className="h-8 bg-gray-100 dark:bg-gray-900 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <img 
                  src="https://i.ibb.co/J4zct9R/poni.png" 
                  alt="Interfaz de Venta POS en uso mostrando punto de venta y gestión de inventario" 
                  className="w-full h-auto"
                  width="600"
                  height="400"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="video-section" className="py-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block p-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-sm mb-6 animate-pulse shadow-lg">
              <Sparkles className="inline-block mr-2 h-4 w-4" />
              Mira cómo funciona
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Conoce Venta POS en acción
            </h2>
            
            <div className="mb-8">
              <iframe 
                width="100%" 
                height="500" 
                src="https://www.youtube.com/embed/-Uvd85r4AhE" 
                title="Video demostrativo de Venta POS" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="rounded-xl shadow-2xl border-4 border-white dark:border-gray-800"
              ></iframe>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 transform hover:scale-105 transition-all duration-500">
              <div className="aspect-w-16 aspect-h-9 relative">
                <iframe 
                  width="100%" 
                  height="500" 
                  src="https://www.youtube.com/embed/-Uvd85r4AhE" 
                  title="Video demostrativo de Venta POS" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg h-12 px-8 text-lg">
                <Link to="/register">
                  <Rocket className="mr-2 h-5 w-5" />
                  ¡Pruébalo Gratis Ahora!
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="pricing-heading" className="py-16 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 relative">
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/45-degree-fabric-light.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block py-1 px-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium text-sm rounded-full mb-4 shadow-lg animate-pulse">
                <Flame className="inline-block mr-1 h-4 w-4" /> Oferta por tiempo limitado
              </span>
              <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                ¡Oferta especial!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Aprovecha esta oportunidad única y consigue Venta POS al mejor precio. La oferta termina pronto.
              </p>
            </div>

            <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-1 px-4 transform rotate-45 translate-y-5 translate-x-10 shadow-lg font-semibold">
                  -50%
                </div>
              </div>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 md:border-r border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-teal-50 dark:from-gray-800 dark:to-teal-900/20">
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Licencia de por Vida</h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="line-through text-gray-500 dark:text-gray-400 text-lg">$179.900</span>
                      <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">$89.900</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">
                        ¡SIN PAGOS MENSUALES!
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Acceso completo a todas las funciones</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Soporte prioritario vía WhatsApp</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Actualizaciones gratuitas</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Sin límites de productos ni ventas</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <Button asChild className="h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-lg transform hover:translate-y-[-2px] transition-all duration-300">
                        <a href="https://mpago.la/2XzZg3m" target="_blank" rel="noopener noreferrer">
                          <Wallet className="mr-2 h-5 w-5" />
                          Activa tu suscripción YA
                        </a>
                      </Button>
                     
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/20 dark:to-teal-900/30 p-8 flex flex-col">
                    <div className="mb-6">
                      <h4 className="font-semibold text-lg mb-2 text-teal-800 dark:text-teal-300">La oferta termina en:</h4>
                      <div className="flex items-center justify-center gap-2 text-center">
                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 w-20 border-b-4 border-teal-500">
                          <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatTime(timeLeft.hours)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Horas</div>
                        </div>
                        <div className="text-xl font-bold text-teal-700 dark:text-teal-300">:</div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 w-20 border-b-4 border-teal-500">
                          <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatTime(timeLeft.minutes)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Minutos</div>
                        </div>
                        <div className="text-xl font-bold text-teal-700 dark:text-teal-300">:</div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 w-20 border-b-4 border-teal-500">
                          <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatTime(timeLeft.seconds)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Segundos</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-grow">
                      <h4 className="font-semibold text-lg text-teal-800 dark:text-teal-300">¿Por qué elegir ahora?</h4>
                      <div className="flex items-start gap-2">
                        <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-teal-800 dark:text-teal-200">Precio más bajo garantizado, nunca volverá a este valor</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-teal-800 dark:text-teal-200">Ahorra <span className="font-bold text-red-500">$39.000</span> versus otros sistemas cada mes con esta oferta especial</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-teal-800 dark:text-teal-200">Acceso <span className="font-bold">completo</span> a todas las funciones premium</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg border-l-4 border-amber-500">
                        <Award className="h-8 w-8 text-amber-500" />
                        <span className="text-sm font-semibold">¡Agenda una demo sin compromiso!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" aria-labelledby="features-heading" className="py-24 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 -rotate-3 transform origin-top-left"></div>
        <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-300/20 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-300/10 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block p-2 px-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm mb-4 animate-bounce">
              <Sparkles className="inline-block mr-2 h-4 w-4" />
              Funcionalidades Premium
            </div>
            
            <h2 id="features-heading" className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Beneficios Destacados
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              Todas las herramientas que necesitas para gestionar tu negocio de manera eficiente y profesional,
              con una experiencia de usuario excepcional.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden group hover:-translate-y-2 bg-white dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-6 transform group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-xl relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/40 to-indigo-500/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="relative inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <Button asChild className="relative h-14 text-lg px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-lg">
                <Link to="/register">
                  <Rocket className="mr-2 h-5 w-5" />
                  ¡Pruébalo Gratis Ahora!
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 mb-4">
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rápido</h3>
              <p className="text-gray-600 dark:text-gray-400">Interfaz optimizada para operaciones ágiles y eficientes</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 flex flex-col items-center text-center transform md:translate-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Headphones className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Soporte Dedicado</h3>
              <p className="text-gray-600 dark:text-gray-400">Asistencia prioritaria para resolver todas tus dudas</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fácil de Usar</h3>
              <p className="text-gray-600 dark:text-gray-400">Diseñado pensando en la mejor experiencia de usuario</p>
            </div>
          </div>
        </div>
      </section>
      
      <section aria-labelledby="testimonial-heading" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 id="testimonial-heading" className="sr-only">Testimonios de clientes</h2>
          <div className="max-w-4xl mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 shadow-lg relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                <img 
                  src="https://thumbs.dreamstime.com/z/una-mujer-sentada-en-roca-y-mira-cascada-el-bosque-un-sombrero-de-vacaciones-la-naturaleza-282495595.jpg?ct=jpeg" 
                  alt="Ana Martínez, propietaria de Farmacia Local" 
                  className="w-full h-full object-cover"
                  width="80"
                  height="80"
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className="text-center pt-12">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <blockquote>
                <p className="text-xl md:text-2xl italic mb-6 text-gray-700 dark:text-gray-300">
                  "La gestión de inventario con Venta POS es excepcional. Ahora puedo rastrear fácilmente los medicamentos y nunca me quedo sin stock. El soporte al cliente es de primera clase."
                </p>
              </blockquote>
              <div>
                <p className="font-semibold text-lg">Ana Martínez</p>
                <p className="text-gray-600 dark:text-gray-400">Farmacia Local</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section aria-labelledby="qr-heading" className="py-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="qr-heading" className="text-2xl md:text-3xl font-bold mb-6">
              ¡Si vienes de Tik Tok, crea a continuación tu QR!
            </h2>
            <Card className="shadow-xl border-0">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Crea GRATIS tu QR para Transferencias</h3>
                <div className="flex justify-center mb-6">
                  <QrCode className="h-48 w-48 text-primary" />
                </div>
                <Button asChild className="text-lg h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link to="https://qr.ventapos.app/">Generar QR GRATIS</Link>
                </Button>
               
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <footer className="py-12 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura.PNG-dde30VtfYzHLUdcOvDHgQYHl2z3yfa.png" 
                alt="Logo de Venta POS" 
                className="h-8 w-auto"
                width="120"
                height="32"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Venta POS es desarrollado en Chile 🇨🇱 por Alphalabs</p>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <nav aria-label="Pie de página">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
                <Link to="/login" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Registrarse
                </Link>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Términos y Condiciones
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Política de Privacidad
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Contacto
                </a>
              </div>
            </nav>
            
            <div className="text-center mt-8 text-gray-500 text-sm dark:text-gray-500">
              &copy; {new Date().getFullYear()} Venta POS. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
