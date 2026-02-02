import React, { useState, useMemo } from 'react';

interface Pack {
  id: number;
  messages: number;
  price: number;
  pricePerMsg: number;
  popular?: boolean;
  enterprise?: boolean;
}

interface Savings {
  baseCost: number;
  packCost: number;
  monthlySavings: number;
  yearlySavings: number;
  percentage: string;
}

const packs: Pack[] = [
  { id: 1, messages: 50, price: 1900, pricePerMsg: 38.00 },
  { id: 2, messages: 100, price: 3500, pricePerMsg: 35.00 },
  { id: 3, messages: 200, price: 4900, pricePerMsg: 24.50, popular: true },
  { id: 4, messages: 500, price: 10900, pricePerMsg: 21.80 },
  { id: 5, messages: 1000, price: 19900, pricePerMsg: 19.90 },
  { id: 6, messages: 1500, price: 26900, pricePerMsg: 17.93 },
  { id: 7, messages: 2000, price: 34900, pricePerMsg: 17.45 },
  { id: 8, messages: 5000, price: 69900, pricePerMsg: 13.98, enterprise: true }
];

const TailwindPackCalculator: React.FC = () => {
  const [monthlyTurnos, setMonthlyTurnos] = useState<string>('');
  const [messagesPerTurno, setMessagesPerTurno] = useState<number>(1);

  const totalMessages = useMemo<number>(() => {
    return parseInt(monthlyTurnos || '0') * messagesPerTurno;
  }, [monthlyTurnos, messagesPerTurno]);

  const recommendedPack = useMemo<Pack>(() => {
    return packs.find(pack => pack.messages >= totalMessages) || packs[packs.length - 1];
  }, [totalMessages]);

  const savings = useMemo<Savings | null>(() => {
    if (!totalMessages) return null;
    const baseCost = totalMessages * 38;
    const packCost = recommendedPack.price;
    const monthlySavings = Math.max(0, baseCost - packCost);
    
    return {
      baseCost,
      packCost,
      monthlySavings,
      yearlySavings: monthlySavings * 12,
      percentage: monthlySavings > 0 ? ((monthlySavings / baseCost) * 100).toFixed(0) : '0'
    };
  }, [totalMessages, recommendedPack]);

  const handleTurnosChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    // Solo permitir números positivos
    if (value === '' || (parseInt(value) >= 0 && !isNaN(parseInt(value)))) {
      setMonthlyTurnos(value);
    }
  };

  const handleMessagesChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setMessagesPerTurno(parseInt(e.target.value));
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-AR');
  };

  const calculateSavingsPercentage = (pack: Pack): string => {
    return ((1 - pack.pricePerMsg / 38) * 100).toFixed(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Calculadora de Packs WhatsApp</h2>
        <p className="text-gray-600">Encontrá el plan perfecto para tu negocio</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div>
          <label 
            htmlFor="turnos-input"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            ¿Cuántos turnos tenés por mes?
          </label>
          <input
            id="turnos-input"
            type="number"
            min="0"
            value={monthlyTurnos}
            onChange={handleTurnosChange}
            placeholder="Ej: 150"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        <div>
          <label 
            htmlFor="messages-select"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            ¿Cuántos recordatorios por turno?
          </label>
          <select
            id="messages-select"
            value={messagesPerTurno}
            onChange={handleMessagesChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition cursor-pointer"
          >
            <option value={1}>1 recordatorio (24hs antes)</option>
            <option value={2}>2 recordatorios (24hs + 2hs antes)</option>
            <option value={3}>3 recordatorios (confirmación + 24hs + 2hs)</option>
          </select>
        </div>
      </div>

      {totalMessages > 0 && recommendedPack && (
        <>
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl p-8 text-center">
            <p className="text-sm opacity-90 mb-1">Necesitás aproximadamente</p>
            <p className="text-5xl font-bold mb-2">{formatCurrency(totalMessages)}</p>
            <p className="text-lg opacity-95 mb-4">mensajes por mes</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm mb-1">Te recomendamos</p>
              <p className="text-3xl font-bold">Pack {recommendedPack.messages}</p>
              <p className="text-2xl font-bold mt-2">
                ${formatCurrency(recommendedPack.price)}/mes
              </p>
            </div>
          </div>

          {savings && savings.monthlySavings > 0 && (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <span role="img" aria-label="money">💰</span> Tu Ahorro
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Mensual</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${formatCurrency(savings.monthlySavings)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Anual</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${formatCurrency(savings.yearlySavings)}
                  </p>
                </div>
              </div>
              <p className="text-center text-green-900 font-semibold">
                Ahorrás {savings.percentage}% vs Pack 50
              </p>
            </div>
          )}

          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition transform hover:scale-105 active:scale-95"
            onClick={() => {
              // Acá podés agregar la lógica de contratación
              console.log(`Contratar Pack ${recommendedPack.messages}`);
            }}
          >
            Contratar Pack {recommendedPack.messages} - ${formatCurrency(recommendedPack.price)}/mes
          </button>
        </>
      )}

      {totalMessages > 0 && recommendedPack && (
        <div className="space-y-3">
        <h3 className="text-lg font-semibold">Todos los packs disponibles</h3>
        {packs.map((pack) => {
          const isRecommended = recommendedPack && pack.id === recommendedPack.id;
          const packSavings = calculateSavingsPercentage(pack);
          
          return (
            <div
              key={pack.id}
              className={`flex justify-between items-center p-4 rounded-lg border-2 transition ${
                isRecommended
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <p className="font-semibold">
                  Pack {pack.messages}
                  {pack.popular && (
                    <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded">
                      ⭐ Popular
                    </span>
                  )}
                  {pack.enterprise && (
                    <span className="ml-2 text-xs bg-purple-400 text-purple-900 px-2 py-1 rounded">
                      💎 Enterprise
                    </span>
                  )}
                  {isRecommended && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      ✓ Recomendado
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">${pack.pricePerMsg.toFixed(2)}/mensaje</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${formatCurrency(pack.price)}</p>
                {parseFloat(packSavings) > 0 && (
                  <p className="text-xs text-green-600 font-semibold">Ahorrás {packSavings}%</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default TailwindPackCalculator;