import React, { useState } from 'react';
import { Drink, DrinkEntry } from '../types';
import { createDrink } from '../utils/calculations';

interface AddDrinkFormProps {
  onAddDrink: (entry: DrinkEntry) => Promise<DrinkEntry>;
}

const drinkTypes = [
  { value: 'beer', label: 'Öl' },
  { value: 'wine', label: 'Vin' },
  { value: 'spirit', label: 'Sprit' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'other', label: 'Annat' }
];

const commonDrinks = [
  { name: 'Stor stark', type: 'beer' as const, volume: 50, alcoholPercentage: 5.2 },
  { name: 'Liten stark', type: 'beer' as const, volume: 33, alcoholPercentage: 5.2 },
  { name: 'Vin (glas)', type: 'wine' as const, volume: 15, alcoholPercentage: 12 },
  { name: 'Vin (flaska)', type: 'wine' as const, volume: 75, alcoholPercentage: 12 },
  { name: 'Vodka (shot)', type: 'spirit' as const, volume: 4, alcoholPercentage: 40 },
  { name: 'Whisky (shot)', type: 'spirit' as const, volume: 4, alcoholPercentage: 40 }
];

export const AddDrinkForm: React.FC<AddDrinkFormProps> = ({ onAddDrink }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Drink['type']>('beer');
  const [volume, setVolume] = useState('');
  const [alcoholPercentage, setAlcoholPercentage] = useState('');
  const [notes, setNotes] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !volume || !alcoholPercentage) {
      alert('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    const drink = createDrink(name, type, parseFloat(volume), parseFloat(alcoholPercentage));
    
    const entry: DrinkEntry = {
      id: '', // Will be set by backend
      drink,
      timestamp: new Date(),
      notes: notes.trim() || undefined
    };

    const createdEntry = await onAddDrink(entry);
    
    // Reset form
    setName('');
    setVolume('');
    setAlcoholPercentage('');
    setNotes('');
    setShowCustomForm(false);
  };

  const handleQuickAdd = async (drink: typeof commonDrinks[0]) => {
    const newDrink = createDrink(drink.name, drink.type, drink.volume, drink.alcoholPercentage);
    
    const entry: DrinkEntry = {
      id: '', // Will be set by backend
      drink: newDrink,
      timestamp: new Date()
    };

    const createdEntry = await onAddDrink(entry);
  };

  return (
    <div className="add-drink-form">
      <h2>Lägg till dryck</h2>
      
      {/* Quick add buttons */}
      <div className="quick-add-section">
        <h3>Snabblägg till</h3>
        <div className="quick-add-buttons">
          {commonDrinks.map((drink, index) => (
            <button
              key={index}
              type="button"
              className="quick-add-btn"
              onClick={() => handleQuickAdd(drink)}
            >
              {drink.name}
              <span className="drink-details">
                {drink.volume}cl, {drink.alcoholPercentage}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-divider">
        <span>eller</span>
      </div>

      {/* Custom form */}
      <button
        type="button"
        className="toggle-form-btn"
        onClick={() => setShowCustomForm(!showCustomForm)}
      >
        {showCustomForm ? 'Dölj' : 'Visa'} anpassad form
      </button>

      {showCustomForm && (
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label htmlFor="name">Namn på drycken *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Carlsberg, Chardonnay"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Typ *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as Drink['type'])}
              required
            >
              {drinkTypes.map(drinkType => (
                <option key={drinkType.value} value={drinkType.value}>
                  {drinkType.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="volume">Volym (cl) *</label>
              <input
                id="volume"
                type="number"
                step="0.1"
                min="0"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="33"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="alcohol">Alkoholhalt (%) *</label>
              <input
                id="alcohol"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={alcoholPercentage}
                onChange={(e) => setAlcoholPercentage(e.target.value)}
                placeholder="5.2"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Anteckningar (valfritt)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lägg till anteckningar..."
              rows={2}
            />
          </div>

          <button type="submit" className="submit-btn">
            Lägg till dryck
          </button>
        </form>
      )}
    </div>
  );
}; 