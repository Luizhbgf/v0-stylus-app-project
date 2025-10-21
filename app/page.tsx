import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, Sparkles, Users, Star, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Styllus Logo" width={180} height={60} className="h-12 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#servicos"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Serviços
              </Link>
              <Link href="#sobre" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Sobre
              </Link>
              <Link
                href="#contato"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Contato
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-foreground">
                  Entrar
                </Button>
              </Link>
              <Link href="/agendar">
                <Button className="bg-primary text-primary-foreground hover:bg-accent">Agendar Agora</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <Navbar user={profile} />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Beleza e Bem-Estar
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">
              Sua Beleza, Nossa Paixão
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
              Agende seus serviços de estética e beleza de forma rápida e prática. Profissionais qualificados prontos
              para realçar sua beleza natural.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/agendar">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black text-lg px-8">
                  Agendar Horário
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#servicos">
                <Button size="lg" variant="outline" className="text-lg px-8 border-gold/20 bg-transparent">
                  Ver Serviços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-gold/20 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 text-gold mb-6">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Agendamento Fácil</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agende seus horários online de forma rápida e prática, 24 horas por dia.
              </p>
            </Card>

            <Card className="p-8 text-center border-gold/20 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 text-gold mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Profissionais Qualificados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Equipe especializada e experiente para cuidar da sua beleza com excelência.
              </p>
            </Card>

            <Card className="p-8 text-center border-gold/20 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 text-gold mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Horários Flexíveis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diversos horários disponíveis para se adequar à sua rotina.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Nossos Serviços</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma ampla gama de serviços para realçar sua beleza
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="overflow-hidden border-border hover:shadow-lg transition-all group">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <service.icon className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{service.name}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{service.price}</span>
                    <Link href="/agendar">
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-accent">
                        Agendar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              O Que Dizem Nossos Clientes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.service}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
              Pronta Para Se Sentir Incrível?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Agende seu horário agora e descubra o melhor da estética e beleza
            </p>
            <Link href="/agendar">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-accent text-lg px-8">
                Agendar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image src="/logo.png" alt="Styllus Logo" width={150} height={50} className="h-10 w-auto mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sua beleza, nossa paixão. Cuidando de você com excelência.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Serviços</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
              <h4 className="font-semibold mb-4 text-foreground">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
              <h4 className="font-semibold mb-4 text-foreground">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contato@styllus.com.br</li>
                <li>(11) 9999-9999</li>
                <li>Seg - Sex: 9h às 19h</li>
                <li>Sáb: 9h às 17h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Styllus Estética e Beleza. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const services = [
  {
    name: "Corte e Escova",
    description: "Corte personalizado e escova profissional para realçar sua beleza",
    price: "R$ 120",
    icon: Sparkles,
  },
  {
    name: "Manicure e Pedicure",
    description: "Cuidados completos para suas unhas com produtos de qualidade",
    price: "R$ 80",
    icon: Star,
  },
  {
    name: "Design de Sobrancelhas",
    description: "Modelagem perfeita para valorizar seu olhar",
    price: "R$ 60",
    icon: Sparkles,
  },
  {
    name: "Maquiagem",
    description: "Maquiagem profissional para qualquer ocasião",
    price: "R$ 150",
    icon: Star,
  },
  {
    name: "Tratamentos Faciais",
    description: "Limpeza de pele e tratamentos estéticos faciais",
    price: "R$ 180",
    icon: Sparkles,
  },
  {
    name: "Depilação",
    description: "Depilação com cera de alta qualidade",
    price: "R$ 90",
    icon: Star,
  },
]

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
