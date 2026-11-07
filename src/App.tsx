import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  Gift,
  Layers3,
  LockKeyhole,
  MousePointer2,
  Pencil,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import {
  INITIAL_CARDS,
  getOtherRemainingCard,
  getRemainingCards,
  inferCardType,
  shuffleCards,
} from './game'
import type { CardData, GamePhase } from './game'

const PHASE_COPY: Record<GamePhase, { eyebrow: string; title: string }> = {
  preview: { eyebrow: '牌面预览', title: '先记住这 9 张牌' },
  flipping: { eyebrow: '准备开始', title: '正在翻牌…' },
  shuffling: { eyebrow: '准备开始', title: '正在打乱牌序…' },
  'select-base': { eyebrow: '第一步 · 相信直觉', title: '选择你的初始底牌' },
  eliminate: { eyebrow: '第二步 · 逐个排除', title: '选择一张牌排除' },
  revealing: { eyebrow: '牌面揭晓', title: '这张牌，不是你的答案' },
  decision: { eyebrow: '轮到你了', title: '见好就收，还是继续？' },
  final: { eyebrow: '第三步 · 最终选择', title: '直觉，还是命运？' },
  result: { eyebrow: '最终结果', title: '你的答案已揭晓' },
}

function padPosition(index: number) {
  return String(index + 1).padStart(2, '0')
}

function App() {
  const [cardCollection, setCardCollection] = useState<CardData[]>(INITIAL_CARDS)
  const [deck, setDeck] = useState<CardData[]>(INITIAL_CARDS)
  const [phase, setPhase] = useState<GamePhase>('preview')
  const [baseId, setBaseId] = useState<string | null>(null)
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [lastExcludedId, setLastExcludedId] = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState('')
  const timers = useRef<number[]>([])
  const cardElements = useRef(new Map<string, HTMLButtonElement>())
  const previousPositions = useRef(new Map<string, { left: number; top: number }>())
  const shuffleAnimations = useRef<Animation[]>([])

  const baseCard = deck.find((card) => card.id === baseId) ?? null
  const basePosition = deck.findIndex((card) => card.id === baseId)
  const lastExcluded = deck.find((card) => card.id === lastExcludedId) ?? null
  const resultCard = deck.find((card) => card.id === resultId) ?? null
  const remainingCards = getRemainingCards(deck, baseId, excludedIds)
  const otherFinalCard = getOtherRemainingCard(deck, baseId, excludedIds)
  const otherFinalPosition = deck.findIndex((card) => card.id === otherFinalCard?.id)
  const currentStep = phase === 'final' || phase === 'result' ? 3 : baseId ? 2 : 1
  const copy = PHASE_COPY[phase]

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    shuffleAnimations.current.forEach((animation) => animation.cancel())
    shuffleAnimations.current = []
  }

  function schedule(callback: () => void, delay: number) {
    timers.current.push(window.setTimeout(callback, delay))
  }

  useEffect(() => {
    return clearTimers
  }, [])

  useLayoutEffect(() => {
    shuffleAnimations.current.forEach((animation) => animation.cancel())
    shuffleAnimations.current = []
    const nextPositions = new Map<string, { left: number; top: number }>()
    cardElements.current.forEach((element, id) => {
      const rect = element.getBoundingClientRect()
      nextPositions.set(id, { left: rect.left, top: rect.top })
    })

    if (phase === 'shuffling' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cardElements.current.forEach((element, id) => {
        const previous = previousPositions.current.get(id)
        const next = nextPositions.get(id)
        if (!previous || !next) return
        const deltaX = previous.left - next.left
        const deltaY = previous.top - next.top
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
        const animation = element.animate([
          { transform: `translate(${deltaX}px, ${deltaY}px) rotate(0deg)`, zIndex: 4 },
          { transform: `translate(${deltaX * 0.48}px, ${deltaY * 0.48 - 12}px) rotate(${deltaX > 0 ? 2 : -2}deg)`, offset: 0.52, zIndex: 4 },
          { transform: 'translate(0, 0) rotate(0deg)', zIndex: 4 },
        ], { duration: 400, easing: 'cubic-bezier(.22,.8,.25,1)' })
        shuffleAnimations.current.push(animation)
      })
    }
    previousPositions.current = nextPositions
  }, [deck, phase])

  useEffect(() => {
    if (!showHelp && !showEditor) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHelp(false)
        setShowEditor(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showHelp, showEditor])

  function startGame() {
    clearTimers()
    setPhase('flipping')
    ;[520, 940, 1360].forEach((delay) => {
      schedule(() => {
        setDeck((currentDeck) => shuffleCards(currentDeck))
        setPhase('shuffling')
      }, delay)
    })
    schedule(() => setPhase('select-base'), 1820)
  }

  function chooseBase(id: string) {
    if (phase !== 'select-base') return
    setBaseId(id)
    setPhase('eliminate')
  }

  function excludeCard(id: string) {
    if (phase !== 'eliminate' || id === baseId || excludedIds.includes(id)) return
    setExcludedIds((current) => [...current, id])
    setLastExcludedId(id)
    setPhase('revealing')
    schedule(() => setPhase('decision'), 650)
  }

  function finishGame(id: string) {
    clearTimers()
    setResultId(id)
    setPhase('result')
  }

  function handleCardClick(card: CardData) {
    if (phase === 'select-base') chooseBase(card.id)
    else if (phase === 'eliminate') excludeCard(card.id)
    else if (phase === 'final' && !excludedIds.includes(card.id)) finishGame(card.id)
  }

  function resetGame(cards: CardData[] = cardCollection) {
    clearTimers()
    setDeck(cards)
    setPhase('preview')
    setBaseId(null)
    setExcludedIds([])
    setLastExcludedId(null)
    setResultId(null)
  }

  function openEditor() {
    setDraftValues(Object.fromEntries(cardCollection.map((card) => [card.id, card.value])))
    setEditError('')
    setShowEditor(true)
  }

  function restoreDefaultDraft() {
    setDraftValues(Object.fromEntries(INITIAL_CARDS.map((card) => [card.id, card.value])))
    setEditError('')
  }

  function saveEditedCards(event: FormEvent) {
    event.preventDefault()
    const values = cardCollection.map((card) => draftValues[card.id]?.trim() ?? '')
    if (values.some((value) => !value)) {
      setEditError('每张卡牌都需要填写内容，不能为空。')
      return
    }
    const editedCards = cardCollection.map((card, index) => ({
      ...card,
      value: values[index],
      type: inferCardType(values[index]),
    }))
    setCardCollection(editedCards)
    resetGame(editedCards)
    setShowEditor(false)
  }

  function isCardRevealed(card: CardData) {
    return phase === 'preview' || phase === 'result' || excludedIds.includes(card.id)
  }

  function isCardInteractive(card: CardData) {
    if (phase === 'select-base') return true
    if (phase === 'eliminate') return card.id !== baseId && !excludedIds.includes(card.id)
    if (phase === 'final') return !excludedIds.includes(card.id)
    return false
  }

  return (
    <div className={`app-shell phase-${phase}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); resetGame() }} aria-label="一念之间，返回游戏首页">
          <span className="brand-mark"><span>9</span><i /></span>
          <span className="brand-name">一念之间<small>THE NINE</small></span>
        </a>
        <div className="header-note"><Sparkles size={14} /> 一场关于直觉的游戏</div>
        <div className="header-actions">
          <button className="text-button" onClick={() => setShowHelp(true)}><CircleHelp size={18} />玩法说明</button>
          <button className="icon-button" onClick={() => resetGame()} aria-label="重新开始" title="重新开始"><RotateCcw size={19} /></button>
        </div>
      </header>

      <main className="main-content">
        <section className="game-intro">
          <div>
            <p className="eyebrow"><span /> NINE CARDS · ONE CHOICE</p>
            <h1>九张牌，<em>一个答案。</em></h1>
            <p className="intro-description">第一直觉有多准？排除干扰，把最后的选择交给命运。</p>
          </div>
          <ol className="stepper" aria-label="游戏进度">
            {['选择底牌', '逐个排除', '最终揭晓'].map((label, index) => {
              const step = index + 1
              return (
                <li key={label} className={step === currentStep ? 'active' : step < currentStep ? 'complete' : ''}>
                  <span>{step < currentStep ? <Check size={15} strokeWidth={3} /> : `0${step}`}</span>
                  <small>{label}</small>
                </li>
              )
            })}
          </ol>
        </section>

        <div className="game-layout">
          <aside className="prize-pool" aria-label="实时奖池">
            <div className="prize-pool-header">
              <span className="pool-eyebrow"><Gift size={13} /> PRIZE POOL</span>
              <div className="pool-title-row">
                <h2>奖池</h2>
                <div className="pool-count"><strong>{cardCollection.length - excludedIds.length}</strong><span>/ 9</span></div>
              </div>
              <p>当前剩余奖励</p>
            </div>
            <ol className="prize-list">
              {cardCollection.map((prize, index) => {
                const isExcluded = excludedIds.includes(prize.id)
                const isLatest = lastExcludedId === prize.id && (phase === 'revealing' || phase === 'decision')
                const isResult = resultId === prize.id
                return (
                  <li
                    key={prize.id}
                    className={`${isExcluded ? 'is-prize-excluded' : ''} ${isLatest ? 'is-latest' : ''} ${isResult ? 'is-prize-result' : ''}`}
                    aria-label={`${prize.value}，${isResult ? '最终选择' : isExcluded ? '已排除' : '仍在奖池'}`}
                  >
                    <span className="prize-index">{padPosition(index)}</span>
                    <span className={`prize-value ${prize.type !== 'number' ? 'is-phone-prize' : ''}`}>
                      {prize.type !== 'number' ? prize.value === 'iPhone18Pro' ? <><span>iPhone</span><strong>18 Pro</strong></> : prize.value : prize.value}
                    </span>
                    <span className="prize-state">
                      {isResult ? <Trophy size={15} /> : isExcluded ? <X size={14} /> : <i />}
                    </span>
                  </li>
                )
              })}
            </ol>
            <div className="pool-footer"><span className="pool-live-dot" />排除后实时更新</div>
          </aside>

          <section className="board-section" aria-label="九宫格牌桌">
            <div className="board-caption">
              <span><Layers3 size={16} /> 命运牌桌</span>
              <span>{phase === 'preview' ? '所有牌面均已公开' : `剩余 ${remainingCards.length} 张未排除`}</span>
            </div>
            <div className={`game-board phase-${phase}`}>
              {deck.map((card, index) => {
                const revealed = isCardRevealed(card)
                const excluded = excludedIds.includes(card.id)
                const isBase = card.id === baseId
                const isResult = card.id === resultId
                const interactive = isCardInteractive(card)
                return (
                  <button
                    key={card.id}
                    data-card-id={card.id}
                    ref={(element) => {
                      if (element) cardElements.current.set(card.id, element)
                      else cardElements.current.delete(card.id)
                    }}
                    className={`game-card ${revealed ? 'is-revealed' : ''} ${excluded ? 'is-excluded' : ''} ${isBase ? 'is-base' : ''} ${isResult ? 'is-result' : ''} ${interactive ? 'is-interactive' : ''}`}
                    style={{ '--index': index } as CSSProperties}
                    onClick={() => handleCardClick(card)}
                    disabled={!interactive}
                    aria-label={revealed ? `${padPosition(index)}号位，${card.value}${excluded ? '，已排除' : ''}` : `${padPosition(index)}号位，未知牌面${isBase ? '，初始底牌' : ''}`}
                  >
                    <span className="card-inner">
                      <span className="card-face card-back">
                        <span className="card-topline"><b>NO. {padPosition(index)}</b><Sparkles size={16} /></span>
                        <span className="back-design" aria-hidden="true"><i /><i /><i /></span>
                        <span className="position-number">{padPosition(index)}</span>
                        <span className="back-label">{isBase ? <><LockKeyhole size={14} /> 初始底牌</> : '未知牌面'}</span>
                        <span className="card-footerline">THE NINE <span>✦</span> TRUST YOUR GUT</span>
                      </span>
                      <span className={`card-face card-front ${card.type !== 'number' ? 'phone-card' : ''}`}>
                        <span className="card-topline"><b>LUCKY CARD</b><span>{padPosition(index)}</span></span>
                        <span className={`card-value ${card.type === 'number' && card.value.length > 4 ? 'compact-value' : ''} ${card.type === 'number' && card.value.length > 7 ? 'extra-compact-value' : ''}`}>
                          {card.type !== 'number'
                            ? card.value === 'iPhone18Pro' ? <><span>iPhone</span><strong>18 Pro</strong></> : <strong>{card.value}</strong>
                            : card.value}
                        </span>
                        <span className="front-footer">
                          {isResult ? <><Trophy size={15} /> 你的最终选择</> : excluded ? <><X size={15} /> 已排除</> : isBase && phase === 'result' ? <><LockKeyhole size={14} /> 初始底牌</> : <><Sparkles size={14} /> 一念之间</>}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
              {(phase === 'flipping' || phase === 'shuffling') && (
                <div className="shuffle-overlay"><Shuffle size={22} className="spin" />{phase === 'flipping' ? '翻牌中' : '打乱牌序中'}</div>
              )}
            </div>
            <div className="board-hint">
              <span className={phase === 'result' ? 'hint-dot result' : 'hint-dot'} />
              {phase === 'preview' && '牌面位置将在开始后随机改变'}
              {phase === 'select-base' && '点击任意一张牌，将它锁定为初始底牌'}
              {phase === 'eliminate' && '初始底牌已锁定，点击其他牌进行排除'}
              {(phase === 'flipping' || phase === 'shuffling') && '请记住：位置已变，直觉不变'}
              {(phase === 'revealing' || phase === 'decision') && '已排除的牌会保留在牌桌上'}
              {phase === 'final' && '点击牌面，或使用右侧按钮做出最终选择'}
              {phase === 'result' && '每一张牌，都是刚刚好的答案'}
            </div>
          </section>

          <aside className={`control-panel phase-${phase}`} aria-live="polite">
            <div className="panel-heading">
              <span className="panel-eyebrow">{copy.eyebrow}</span>
              <h2>{copy.title}</h2>
            </div>

            <div className={`base-ticket ${baseCard ? 'locked' : ''}`}>
              <span className="ticket-icon">{baseCard ? <LockKeyhole size={21} /> : '?'}</span>
              <div><small>你的初始底牌</small><strong>{baseCard ? `${padPosition(basePosition)} 号位` : '尚未选择'}</strong></div>
              <span className="ticket-status">{baseCard ? '已锁定' : '等待选择'}</span>
            </div>

            <div className="panel-body">
              {phase === 'preview' && (
                <>
                  <p className="panel-description">所有奖励就在眼前。准备好后，牌面会翻转并随机打乱，先从直觉选一张底牌开始。</p>
                  <div className="mini-rule"><Eye size={18} /><span>现在可以记住牌面<small>开始后，一切交给直觉</small></span></div>
                  <button className="secondary-button edit-cards-button" onClick={openEditor}><Pencil size={17} />编辑 1–9 号卡牌</button>
                  <button className="primary-button" onClick={startGame}>翻牌，开始游戏<ArrowRight size={20} /></button>
                </>
              )}

              {(phase === 'flipping' || phase === 'shuffling') && (
                <div className="loading-state"><span className="loader"><i /><i /><i /></span><p>正在重新安排每张牌的位置</p></div>
              )}

              {phase === 'select-base' && (
                <>
                  <p className="panel-description">不要思考太久。点击牌桌上的任意一张牌，它会成为你最初的答案，并保持神秘直到最后。</p>
                  <div className="mini-rule"><MousePointer2 size={18} /><span>选择一张未知牌<small>底牌在之后的环节中不可排除</small></span></div>
                </>
              )}

              {phase === 'eliminate' && (
                <>
                  <p className="panel-description">从其他未知牌中选择一张排除。牌面会立即公开，你再决定是否继续。</p>
                  <div className="remaining-display"><strong>{remainingCards.length - 1}</strong><span>张可排除的牌<small>每一次排除，都更接近答案</small></span></div>
                </>
              )}

              {(phase === 'revealing' || phase === 'decision') && (
                <>
                  <div className="excluded-result">
                    <small>{phase === 'revealing' ? '正在揭晓…' : '刚刚排除了'}</small>
                    <strong className={lastExcluded && lastExcluded.type !== 'number' ? 'small-value' : ''}>{lastExcluded?.value}</strong>
                  </div>
                  {phase === 'decision' && (
                    <div className="decision-actions">
                      <button className="secondary-button" onClick={() => baseId && finishGame(baseId)}><LockKeyhole size={18} />开启初始底牌</button>
                      {remainingCards.length > 2 ? (
                        <button className="primary-button" onClick={() => setPhase('eliminate')}>继续排除<ArrowRight size={20} /></button>
                      ) : (
                        <button className="primary-button" onClick={() => setPhase('final')}>进入最终二选一<ArrowRight size={20} /></button>
                      )}
                      <p>{remainingCards.length > 2 ? `还剩 ${remainingCards.length} 张牌，包括你的初始底牌` : '只剩初始底牌和最后一张未知牌'}</p>
                    </div>
                  )}
                </>
              )}

              {phase === 'final' && (
                <>
                  <p className="panel-description">其他牌都已排除。现在，相信最初的选择，还是把答案交给最后一张牌？</p>
                  <div className="final-actions">
                    <button className="secondary-button final-choice" onClick={() => baseId && finishGame(baseId)}><span><LockKeyhole size={18} />坚持初始底牌<small>{padPosition(basePosition)} 号位 · 相信第一直觉</small></span><ChevronRight size={19} /></button>
                    <button className="primary-button final-choice" onClick={() => otherFinalCard && finishGame(otherFinalCard.id)}><span><Sparkles size={18} />选择最后一张<small>{padPosition(otherFinalPosition)} 号位 · 相信命运安排</small></span><ChevronRight size={19} /></button>
                  </div>
                </>
              )}

              {phase === 'result' && resultCard && (
                <div className="result-panel">
                  <div className={`result-value ${resultCard.type !== 'number' ? 'phone-result' : ''} ${resultCard.type === 'number' && resultCard.value.length > 4 ? 'compact-result' : ''} ${resultCard.type === 'number' && resultCard.value.length > 7 ? 'extra-compact-result' : ''}`}>
                    <span><Trophy size={17} /> 你的最终答案</span>
                    <strong>{resultCard.type !== 'number' ? resultCard.value === 'iPhone18Pro' ? <><span>iPhone</span>18 Pro</> : resultCard.value : resultCard.value}</strong>
                  </div>
                  <p>{resultId === baseId ? '你坚持了第一直觉，这就是属于你的答案。' : `你选择了命运的另一张牌。初始底牌是 ${baseCard?.value}。`}</p>
                  <button className="primary-button" onClick={() => resetGame()}><RotateCcw size={19} />再玩一次</button>
                </div>
              )}
            </div>

            {excludedIds.length > 0 && phase !== 'result' && (
              <div className="history">
                <div className="history-title"><span>排除记录</span><small>{excludedIds.length} 张</small></div>
                <div className="history-items">
                  {excludedIds.map((id) => {
                    const card = deck.find((item) => item.id === id)
                    return <span key={id}>{card?.value}<X size={11} /></span>
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="site-footer"><span>NO RULES. JUST INSTINCT.</span><span>九张牌 · 一念之间 ✦</span></footer>

      {showHelp && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false) }}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button className="modal-close" onClick={() => setShowHelp(false)} aria-label="关闭玩法说明"><X size={22} /></button>
            <span className="modal-symbol"><Sparkles size={25} /></span>
            <p className="eyebrow">HOW TO PLAY</p>
            <h2 id="help-title">玩法很简单，选择不简单。</h2>
            <ol className="help-steps">
              <li><span>01</span><div><strong>记住牌面，选择底牌</strong><p>点击开始，九张牌会翻面并随机打乱。凭直觉选一张作为初始底牌。</p></div></li>
              <li><span>02</span><div><strong>逐个排除，随时停手</strong><p>每次选择一张其他牌排除并公开内容。你可以随时开启初始底牌，或继续排除。</p></div></li>
              <li><span>03</span><div><strong>最后两张，做出决定</strong><p>只剩初始底牌与最后一张未知牌时，选择其中一个作为你的最终答案。</p></div></li>
            </ol>
            <button className="primary-button" onClick={() => setShowHelp(false)}>明白了，开始选择<ArrowRight size={19} /></button>
          </section>
        </div>
      )}

      {showEditor && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowEditor(false) }}>
          <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
            <button className="modal-close" onClick={() => setShowEditor(false)} aria-label="关闭编辑器"><X size={22} /></button>
            <span className="modal-symbol"><Pencil size={23} /></span>
            <p className="eyebrow">CUSTOMIZE YOUR CARDS</p>
            <h2 id="editor-title">编辑你的九张牌</h2>
            <p className="editor-description">支持数字或文字，每张最多 10 个字符。保存后，牌桌与奖池会同步更新。</p>
            <form onSubmit={saveEditedCards}>
              <div className="editor-grid">
                {cardCollection.map((card, index) => (
                  <label className="editor-field" key={card.id}>
                    <span>{padPosition(index)}</span>
                    <input
                      value={draftValues[card.id] ?? ''}
                      maxLength={10}
                      autoFocus={index === 0}
                      onChange={(event) => {
                        setDraftValues((current) => ({ ...current, [card.id]: event.target.value }))
                        setEditError('')
                      }}
                      aria-label={`${index + 1}号卡牌内容`}
                      placeholder={`卡牌 ${index + 1}`}
                    />
                  </label>
                ))}
              </div>
              {editError && <p className="editor-error" role="alert">{editError}</p>}
              <div className="editor-actions">
                <button type="button" className="restore-button" onClick={restoreDefaultDraft}><RotateCcw size={16} />恢复默认内容</button>
                <div><button type="button" className="cancel-button" onClick={() => setShowEditor(false)}>取消</button><button type="submit" className="primary-button">保存并应用<Check size={18} /></button></div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
