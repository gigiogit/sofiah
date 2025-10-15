import React, { useState, useEffect, useCallback } from 'react';
import { Brain, BrainCircuit, BrainCog, MessageCircle, GraduationCap, Palette } from 'lucide-react';
import { Activity } from '../app/data/activities';
import { useAuth } from '@/context/AuthContext';

interface ActivitySelectorProps {
  activities: Activity[];
  selectedActivity: Activity | null;
  onSelect: (activity: Activity) => void;
  refreshKey: number;
}

const iconMap = {
  messageCircle: MessageCircle,
  brainCircuit: BrainCircuit,
  brainCog: BrainCog,
  brain: Brain,
  palette: Palette,
  graduationCap: GraduationCap,
};

export function ActivitySelector({ activities, selectedActivity, onSelect, refreshKey }: ActivitySelectorProps) {
  const { provAuthenticated } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const fetchQtyModality = useCallback(async (id_category: string): Promise<number> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modality/qty/${provAuthenticated}/${id_category}`)
      if (!response.ok) throw new Error('Failed to fetch modalities')
      if (response.status === 204) {
        return 0;
      }
      const data = await response.json();
      return data[0].qty;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return 0;
    }
  }, [provAuthenticated]);

  useEffect(() => {
    const updateSingleQuantity = async () => {
      if (provAuthenticated !== 0 && selectedActivity?.id) {
        const qty = await fetchQtyModality(selectedActivity.id);
        setQuantities(prev => ({
          ...prev,
          [selectedActivity.id]: qty
        }));
      }
    };

    updateSingleQuantity();
  }, [selectedActivity?.id, refreshKey, provAuthenticated, fetchQtyModality]);

  useEffect(() => {
    const fetchAllQuantities = async () => {
      if (provAuthenticated !== 0) {
        for (const activity of activities) {
          const qty = await fetchQtyModality(activity.id);
          setQuantities(prev => ({
            ...prev,
            [activity.id]: qty
          }));
        }
      }
    };
    
    fetchAllQuantities();
  }, [provAuthenticated, activities, fetchQtyModality]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.icon as keyof typeof iconMap];
        const isSelected = selectedActivity?.id === activity.id;
        const qty = quantities[activity.id] || 0;
        
        return (
          <button
            key={activity.id}
            onClick={() => onSelect(activity)}
            className={`p-4 rounded-lg border-2 transition-all relative ${
              isSelected 
                ? 'border-[var(--primary-color)] bg-[#FFC0CB] text-[var(--primary-color)]' 
                : 'border-gray-200 hover:border-gray-400 hover:bg-[var(--secondary-color)]'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <Icon className={`h-6 w-6 ${isSelected ? 'text-[var(--primary-color)]' : 'text-gray-500'}`} />
              <span className="text-sm font-medium">{activity.name}</span>
            </div>
            {qty > 0 && (
              <div className="absolute top-2 right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white text-xs font-medium px-1.5 z-10">
                {qty}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}