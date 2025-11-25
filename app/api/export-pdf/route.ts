import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { reportData, staffName } = await request.json()

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório - Styllus</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            h1 {
              color: #D4AF37;
              border-bottom: 3px solid #D4AF37;
              padding-bottom: 10px;
            }
            h2 {
              color: #555;
              margin-top: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .stat-card {
              border: 2px solid #D4AF37;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #D4AF37;
              margin: 10px 0;
            }
            .stat-subtitle {
              font-size: 11px;
              color: #999;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #D4AF37;
              color: white;
              padding: 12px;
              text-align: left;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Desempenho - Styllus</h1>
            <p><strong>Período:</strong> ${reportData.periodLabel}</p>
            <p><strong>Profissional:</strong> ${staffName}</p>
            <p><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Agendamentos</div>
              <div class="stat-value">${reportData.completedAppointments.length}</div>
              <div class="stat-subtitle">de ${reportData.appointments.length} totais</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Receita Total</div>
              <div class="stat-value">R$ ${reportData.totalRevenue.toFixed(2)}</div>
              <div class="stat-subtitle">Média: R$ ${
                reportData.completedAppointments.length > 0
                  ? (reportData.totalRevenue / reportData.completedAppointments.length).toFixed(2)
                  : "0.00"
              }</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avaliação Média</div>
              <div class="stat-value">${reportData.avgRating.toFixed(1)} ⭐</div>
              <div class="stat-subtitle">${reportData.feedback.length} avaliações</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Taxa de Retenção</div>
              <div class="stat-value">${reportData.retentionRate.toFixed(1)}%</div>
              <div class="stat-subtitle">${reportData.returningClients} clientes retornaram</div>
            </div>
          </div>

          <h2>Top 5 Profissionais por Receita</h2>
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Nome</th>
                <th>Agendamentos</th>
                <th>Avaliação</th>
                <th>Receita</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.staffPerformance
                .slice(0, 5)
                .map(
                  (s: any, index: number) => `
                <tr>
                  <td>${index + 1}º</td>
                  <td>${s.name}</td>
                  <td>${s.appointments}</td>
                  <td>${s.feedbackCount > 0 ? s.avgRating.toFixed(1) + " ⭐" : "N/A"}</td>
                  <td>R$ ${s.revenue.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <h2>Top 5 Serviços por Receita</h2>
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Serviço</th>
                <th>Quantidade</th>
                <th>Avaliação</th>
                <th>Receita</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(reportData.serviceStats)
                .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
                .slice(0, 5)
                .map(
                  ([name, stats]: [string, any], index: number) => `
                <tr>
                  <td>${index + 1}º</td>
                  <td>${name}</td>
                  <td>${stats.count}</td>
                  <td>${stats.feedbackCount > 0 ? stats.avgRating.toFixed(1) + " ⭐" : "N/A"}</td>
                  <td>R$ ${stats.revenue.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <h2>Análise de Clientes</h2>
          <p><strong>Total de Clientes:</strong> ${reportData.totalClients}</p>
          <p><strong>Clientes Recorrentes:</strong> ${reportData.returningClients}</p>
          <p><strong>Taxa de Retenção:</strong> ${reportData.retentionRate.toFixed(1)}%</p>

          <div class="footer">
            <p>Este relatório foi gerado automaticamente pelo sistema Styllus</p>
            <p>© ${new Date().getFullYear()} Styllus Estética e Beleza</p>
          </div>
        </body>
      </html>
    `

    // In a real production app, you would use a library like puppeteer or jsPDF
    // For now, we'll return HTML that can be printed to PDF by the browser
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-${new Date().toISOString()}.html"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 })
  }
}
