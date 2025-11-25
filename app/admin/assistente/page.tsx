"use client"

import type React from "react"

import { useState } from "react"
import { useChat } from "ai/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send, Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AssistenteIA() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/admin-assistant",
  })

  const [suggestions] = useState([
    "Analise o desempenho financeiro deste mês",
    "Quais são os serviços mais rentáveis?",
    "Identifique oportunidades de crescimento",
    "Compare o desempenho dos funcionários",
    "Analise a satisfação dos clientes",
  ])

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-600" />
          Assistente IA de Negócios
        </h1>
        <p className="text-muted-foreground">
          Obtenha insights, análises e recomendações inteligentes sobre seu negócio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Sucessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              IA Detecta Automaticamente
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Desafios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Análise em Tempo Real
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Sugestões Inteligentes
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Baseadas em Dados
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Chat com Assistente IA</CardTitle>
          <CardDescription>Faça perguntas sobre desempenho, finanças, clientes e mais</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4 mb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Sparkles className="h-16 w-16 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Assistente IA</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Estou aqui para ajudar a analisar seu negócio, identificar oportunidades e fornecer insights baseados
                  em dados reais.
                </p>
                <div className="space-y-2 w-full max-w-md">
                  <p className="text-sm font-medium">Sugestões:</p>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left bg-transparent"
                      onClick={() => {
                        const event = {
                          preventDefault: () => {},
                        } as React.FormEvent<HTMLFormElement>
                        handleInputChange({
                          target: { value: suggestion },
                        } as React.ChangeEvent<HTMLInputElement>)
                        setTimeout(() => handleSubmit(event), 100)
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 bg-yellow-600">
                        <AvatarFallback>IA</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user" ? "bg-yellow-600 text-white" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 bg-gray-600">
                        <AvatarFallback>VC</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-yellow-600">
                      <AvatarFallback>IA</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Faça uma pergunta sobre seu negócio..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
