import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Panel, Pill, SceneProps, Title, frac, useSpring} from './ui';

type Order = {section: string; object: string; area: string; region: string; term: string; budget: string};
type Bid = {who: string; price: string; term: string};

const ordersDefault: Order[] = [
  {section: 'ОВиК', object: 'Поликлиника на Лесной', area: '1 200 м²', region: 'Москва', term: '30 дней', budget: '180 000 ₽'},
  {section: 'ЭОМ', object: 'Клиника, капремонт', area: '850 м²', region: 'Казань', term: '25 дней', budget: '140 000 ₽'},
  {section: 'КР', object: 'Филиал, перепланировка', area: '600 м²', region: 'Тула', term: '20 дней', budget: '95 000 ₽'},
  {section: 'ВК', object: 'Медцентр', area: '950 м²', region: 'Самара', term: '21 день', budget: '110 000 ₽'},
];

const bidsDefault: Bid[] = [
  {who: 'АкваПроект', price: '165 000 ₽', term: '26 дней'},
  {who: 'ТеплоРасчёт', price: '172 000 ₽', term: '28 дней'},
  {who: 'Инженерное бюро «Север»', price: '178 000 ₽', term: '24 дня'},
];

const OrderRow: React.FC<{o: Order; i: number; active: boolean}> = ({o, i, active}) => {
  const s = useSpring(4 + i * 5);
  return (
    <div
      style={{
        border: `2px solid ${active ? C.accent : C.line}`,
        background: active ? C.accentSoft : C.panel,
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 16,
        opacity: s,
        transform: `translateX(${(1 - s) * 80}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <Pill size={24} color={C.accentInk} bg={C.accent}>
          {o.section}
        </Pill>
        <span style={{fontSize: 27, fontWeight: 700}}>{o.object}</span>
      </div>
      <div style={{display: 'flex', gap: 20, marginTop: 12, fontSize: 22, color: C.muted, flexWrap: 'wrap'}}>
        <span>{o.area}</span>
        <span>· {o.region}</span>
        <span>· {o.term}</span>
        <span style={{color: C.ink, fontWeight: 700}}>· {o.budget}</span>
      </div>
    </div>
  );
};

const BidRow: React.FC<{b: Bid; i: number; delay: number}> = ({b, i, delay}) => {
  const s = useSpring(delay + i * 6, {damping: 13});
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: C.panel,
        borderRadius: 14,
        padding: '18px 22px',
        marginTop: 12,
        border: `1.5px solid ${i === 0 ? C.done : C.line}`,
        opacity: s,
        transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <span style={{fontSize: 25, fontWeight: 700}}>{b.who}</span>
      <span style={{fontSize: 24}}>
        <b>{b.price}</b> <span style={{color: C.muted}}>· {b.term}</span>
      </span>
    </div>
  );
};

export const OrderFeed: React.FC<SceneProps & {orders?: Order[]; bids?: Bid[]; showBids?: boolean}> = ({
  dur,
  orders = ordersDefault,
  bids = bidsDefault,
  showBids = true,
}) => {
  const frame = useCurrentFrame();
  const bidsAt = Math.round(dur * 0.42);
  const b = showBids ? frac(frame, dur, 0.38, 0.5) : 0;
  const scroll = interpolate(frame, [0, dur], [0, -30]);
  return (
    <Panel style={{width: 870, boxSizing: 'border-box', overflow: 'hidden'}}>
      <Title sub="Заказы на разделы: площадь, срок, бюджет, регион">Биржа проектировщиков</Title>
      <div style={{transform: `translateY(${scroll}px)`, opacity: 1 - b * 0.55}}>
        {orders.slice(0, b > 0 ? 2 : 4).map((o, i) => (
          <OrderRow key={i} o={o} i={i} active={i === 0 && b > 0} />
        ))}
      </div>
      {showBids && b > 0 ? (
        <div
          style={{
            marginTop: 8,
            background: C.soft,
            borderRadius: 16,
            padding: 22,
            opacity: b,
            transform: `translateY(${(1 - b) * 60}px)`,
          }}
        >
          <div style={{fontSize: 28, fontWeight: 800}}>Отклики · ОВиК</div>
          <div style={{fontSize: 21, color: C.muted, marginTop: 4}}>исполнители предлагают цену и срок</div>
          {bids.map((x, i) => (
            <BidRow key={i} b={x} i={i} delay={bidsAt} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
};
