import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Sparkles, Star, ArrowRight, Shield, Award, Scissors, Heart } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { PREDEFINED_SERVICES } from "@/lib/constants/services"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-primary text-xs md:text-sm font-medium mb-6 md:mb-8 animate-fade-in">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              Beleza e Bem-Estar
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 md:mb-6 text-balance leading-[1.1] tracking-tight px-4">
              Sua Beleza,
              <br />
              <span className="text-primary">Nossa Paixão</span>
            </h1>

            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-12 text-pretty leading-relaxed max-w-2xl mx-auto px-4">
              Agende seus serviços de estética e beleza de forma rápida e prática. Profissionais qualificados prontos
              para realçar sua beleza natural.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <a href="#servicos" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-semibold text-base md:text-lg px-8 md:px-10 py-5 md:py-6 h-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Ver Serviços
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </a>
              <Link href="/quiz" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base md:text-lg px-8 md:px-10 py-5 md:py-6 h-auto border-2 border-primary/30 hover:bg-primary/5 font-semibold bg-transparent"
                >
                  Encontrar Profissional
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl" />
      </section>

      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="p-6 md:p-10 text-center border-primary/10 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">Agendamento Fácil</h3>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                Agende seus horários online de forma rápida e prática, 24 horas por dia.
              </p>
            </Card>

            <Card className="p-6 md:p-10 text-center border-primary/10 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">Profissionais Qualificados</h3>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                Equipe especializada e experiente para cuidar da sua beleza com excelência.
              </p>
            </Card>

            <Card className="p-6 md:p-10 text-center border-primary/10 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">Ambiente Seguro</h3>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                Protocolos de higiene e segurança para seu conforto e tranquilidade.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              NOSSOS SERVIÇOS
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">Serviços Disponíveis</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma ampla gama de serviços de estética e beleza para você
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {PREDEFINED_SERVICES.map((service, index) => (
              <Card
                key={index}
                className="overflow-hidden border-primary/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group bg-card"
              >
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{service}</h3>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/quiz">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold">
                Encontrar Profissional
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              DEPOIMENTOS
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">
              O Que Dizem Nossos Clientes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-primary/10 bg-card hover:shadow-xl transition-all">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.service}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-8 text-balance">
              Pronta Para Se Sentir <span className="text-primary">Incrível?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Entre em contato com nossos profissionais e descubra o melhor da estética e beleza
            </p>
            <Link href="/quiz">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-black font-bold text-xl px-12 py-7 h-auto shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                Encontrar Profissional
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Image src="/logo.png" alt="Styllus Logo" width={150} height={50} className="h-12 w-auto mb-6" />
              <p className="text-muted-foreground leading-relaxed">
                Sua beleza, nossa paixão. Cuidando de você com excelência e dedicação.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground text-lg">Serviços</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Cabelo
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Unhas
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Estética
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Maquiagem
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground text-lg">Empresa</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Equipe
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground text-lg">Contato</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>contato@styllus.com.br</li>
                <li>(11) 9999-9999</li>
                <li>Seg - Sex: 9h às 19h</li>
                <li>Sáb: 9h às 17h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Styllus Estética e Beleza. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Kept testimonials
const testimonials = [
  {
    name: "Maria Silva",
    service: "Corte e Escova",
    text: "Atendimento impecável! Saí do salão me sentindo renovada. A equipe é super atenciosa e profissional.",
  },
  {
    name: "Ana Costa",
    service: "Manicure",
    text: "Melhor salão da região! Sempre consigo horário e o resultado é sempre perfeito. Super recomendo!",
  },
  {
    name: "Juliana Santos",
    service: "Design de Sobrancelhas",
    text: "Profissionais excelentes! O design de sobrancelhas ficou perfeito. Voltarei com certeza!",
  },
]
