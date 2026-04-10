import { useState, useEffect, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Mic2, Hash, ChevronDown } from "lucide-react"

interface Musica {
  id?: string;
  arquivo?: string;
  artista?: string;
  musica?: string;
  inicio?: string;
  [key: string]: string | undefined;
}

export function App() {
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [busca, setBusca] = useState<string>('')
  const [carregando, setCarregando] = useState<boolean>(true)

  // NOVO: Controle de quantas músicas renderizar por vez
  const [itensVisiveis, setItensVisiveis] = useState<number>(20)

  const parseIniParaArray = (texto: string): Musica[] => {
    const linhas = texto.split('\n')
    const resultado: Musica[] = []
    let musicaAtual: Musica | null = null

    for (let linha of linhas) {
      linha = linha.trim()
      if (!linha) continue

      if (linha.startsWith('[') && linha.endsWith(']')) {
        if (musicaAtual) resultado.push(musicaAtual)
        musicaAtual = { id: linha.slice(1, -1) }
      }
      else if (musicaAtual && linha.includes('=')) {
        const [chave, ...resto] = linha.split('=')
        musicaAtual[chave.trim()] = resto.join('=').trim()
      }
    }
    if (musicaAtual) resultado.push(musicaAtual)
    return resultado
  }

  useEffect(() => {
    fetch('/catalogo.txt')
      .then(response => response.text())
      .then(texto => {
        const musicasParseadas = parseIniParaArray(texto)
        setMusicas(musicasParseadas)
        setCarregando(false)
      })
      .catch(erro => {
        console.error("Erro ao carregar o catálogo:", erro)
        setCarregando(false)
      })
  }, [])

  // Quando o usuário digita algo na busca, resetamos a visualização para 50 itens
  useEffect(() => {
    setItensVisiveis(20)
  }, [busca])

  // Aplica o filtro de busca
  const musicasFiltradas = useMemo(() => {
    const termoBusca = busca.toLowerCase()
    return musicas.filter(m =>
      m.id?.includes(termoBusca) ||
      m.artista?.toLowerCase().includes(termoBusca) ||
      m.musica?.toLowerCase().includes(termoBusca) ||
      m.inicio?.toLowerCase().includes(termoBusca)
    )
  }, [busca, musicas])

  // NOVO: Separa apenas a quantidade de músicas que queremos desenhar na tela
  const musicasNaTela = musicasFiltradas.slice(0, itensVisiveis)

  // NOVO: Verifica se ainda tem mais músicas para mostrar
  const temMaisMusicas = itensVisiveis < musicasFiltradas.length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-rose-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-8">

        <header className="text-center space-y-4 pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-rose-500/10 p-4 rounded-full">
              <Mic2 className="w-12 h-12 text-rose-500" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Catálogo de Karaokê
          </h1>
          <p className="text-slate-400 text-lg">
            Encontre sua música, anote o número e prepare a voz!
          </p>
        </header>

        <div className="sticky top-4 z-10 bg-slate-950/80 backdrop-blur-md pb-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por artista, música, trecho ou número..."
              value={busca}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
              className="pl-10 h-14 text-lg bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-rose-500 rounded-2xl"
            />
          </div>
        </div>

        <main className="space-y-4 pb-12">
          {carregando ? (
            <div className="text-center text-slate-500 animate-pulse py-12">
              Carregando o acervo...
            </div>
          ) : musicasNaTela.length > 0 ? (
            <>
              {/* Loop agora usa as músicas recortadas, e não todas */}
              {musicasNaTela.map((musica, index) => (
                <Card key={musica.id || index} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors overflow-hidden">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                    <div className="flex-1 p-5">
                      <h2 className="text-xl font-bold text-white capitalize mb-1">
                        {musica.musica || 'Desconhecida'}
                      </h2>
                      <p className="text-rose-400 font-medium capitalize mb-3">
                        {musica.artista || 'Desconhecido'}
                      </p>
                      {musica.inicio && musica.inicio !== 'verso nao encontrado' && (
                        <p className="text-slate-400 italic text-sm border-l-2 border-slate-700 pl-3">
                          "{musica.inicio}"
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-800 flex items-center justify-center sm:w-32 p-4 sm:p-0 border-t sm:border-t-0 sm:border-l border-slate-700/50">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center justify-center gap-1">
                          <Hash className="w-3 h-3" /> CÓDIGO
                        </p>
                        <span className="text-2xl font-black text-white tracking-wider">
                          {musica.id}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Botão de carregar mais, caso existam mais resultados escondidos */}
              {temMaisMusicas && (
                <button
                  onClick={() => setItensVisiveis(prev => prev + 50)}
                  className="w-full py-4 mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
                >
                  <ChevronDown className="w-5 h-5" /> Mostrar mais opções
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">Nenhuma música encontrada para "{busca}"</p>
            </div>
          )}
        </main>

      </div>
    </div>
  )
}