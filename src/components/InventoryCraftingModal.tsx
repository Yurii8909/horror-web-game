import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  ShieldAlert, 
  HeartPulse, 
  Zap, 
  Activity, 
  Radio, 
  Check, 
  Hammer, 
  Package, 
  Layers
} from 'lucide-react';
import { CRAFTING_RECIPES, RESOURCES_LIST } from '../data/recipesAndSkills';
import { CraftingRecipe, ItemKey, ResourceKey } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';

interface InventoryCraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: { [key in ResourceKey]: number };
  items: { [key in ItemKey]: number };
  onCraftItem: (recipe: CraftingRecipe) => void;
  onUseItem: (itemKey: ItemKey) => void;
}

export const InventoryCraftingModal: React.FC<InventoryCraftingModalProps> = ({
  isOpen,
  onClose,
  resources,
  items,
  onCraftItem,
  onUseItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'survival' | 'defense' | 'escape'>('all');
  const [craftingItemId, setCraftingItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const canCraft = (recipe: CraftingRecipe) => {
    for (const [resKey, count] of Object.entries(recipe.ingredients)) {
      const current = resources[resKey as ResourceKey] || 0;
      if (current < (count || 0)) return false;
    }
    return true;
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canCraft(recipe) || craftingItemId) return;
    setCraftingItemId(recipe.id);
    horrorAudio.playItemPickup();

    setTimeout(() => {
      onCraftItem(recipe);
      setCraftingItemId(null);
      horrorAudio.playCraftSuccess();
    }, 450);
  };

  const filteredRecipes = CRAFTING_RECIPES.filter(
    r => selectedCategory === 'all' || r.category === selectedCategory
  );

  const getRecipeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-red-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-zinc-400" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Activity': return <Activity className="w-5 h-5 text-cyan-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-cyan-300" />;
      default: return <Package className="w-5 h-5 text-zinc-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-zinc-100 font-mono">
                Инвентарь & Верстак Выживания
              </h2>
              <p className="text-xs text-zinc-400">
                Крафтите защитные фаеры, капканы и детали для починки генераторов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two columns (Resources & Items / Crafting Recipes) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 overflow-y-auto pr-1">
          
          {/* Left Column: Collected Resources & Crafted Items */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Resources Section */}
            <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Layers className="w-4 h-4" />
                <span>Ресурсы Леса ({Object.values(resources).reduce((a, b) => a + b, 0)})</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {RESOURCES_LIST.map((res) => {
                  const count = resources[res.id] || 0;
                  return (
                    <div
                      key={res.id}
                      className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: res.color }} 
                        />
                        <span className="text-xs font-medium text-zinc-300 truncate max-w-[90px]">
                          {res.nameRu}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                        x{count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ready Items in Inventory Section */}
            <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Package className="w-4 h-4" />
                <span>Снаряжение в карманах</span>
              </div>

              <div className="flex flex-col gap-2">
                {CRAFTING_RECIPES.map((recipe) => {
                  const count = items[recipe.id] || 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-emerald-950/80 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        {getRecipeIcon(recipe.icon)}
                        <div>
                          <div className="text-xs font-bold text-zinc-200">{recipe.nameRu}</div>
                          <div className="text-[10px] text-zinc-400">В наличии: x{count}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => onUseItem(recipe.id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Применить
                      </button>
                    </div>
                  );
                })}

                {Object.values(items).every(count => count === 0) && (
                  <div className="text-center py-6 text-xs text-zinc-500 italic">
                    У вас пока нет скрафченных предметов. Выберите чертёж справа и соберите ресурсы!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Crafting Recipes */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              {(['all', 'survival', 'defense', 'escape'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                  }`}
                >
                  {cat === 'all' && 'Все рецепты'}
                  {cat === 'survival' && 'Выживание'}
                  {cat === 'defense' && 'Защита от монстра'}
                  {cat === 'escape' && 'Эвакуация'}
                </button>
              ))}
            </div>

            {/* Recipes List */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {filteredRecipes.map((recipe) => {
                const available = canCraft(recipe);
                const isCraftingThis = craftingItemId === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      available
                        ? 'bg-zinc-900/70 border-zinc-700/80 hover:border-amber-500/50'
                        : 'bg-zinc-950/50 border-zinc-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-800 rounded-xl mt-0.5">
                          {getRecipeIcon(recipe.icon)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100">{recipe.nameRu}</h3>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                            {recipe.description}
                          </p>
                          
                          {/* Ingredients list */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {Object.entries(recipe.ingredients).map(([resId, count]) => {
                              const resInfo = RESOURCES_LIST.find(r => r.id === resId);
                              const current = resources[resId as ResourceKey] || 0;
                              const hasEnough = current >= (count || 0);

                              return (
                                <span
                                  key={resId}
                                  className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                    hasEnough
                                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                                      : 'bg-red-950/30 border-red-900/40 text-red-400'
                                  }`}
                                >
                                  <span>{resInfo?.nameRu}:</span>
                                  <strong>{current}/{count}</strong>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Craft Action Button */}
                      <button
                        onClick={() => handleCraft(recipe)}
                        disabled={!available || isCraftingThis}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                          available
                            ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-amber-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                        }`}
                      >
                        {isCraftingThis ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 animate-spin" /> Создание...
                          </span>
                        ) : (
                          'Создать'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
