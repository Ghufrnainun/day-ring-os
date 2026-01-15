import React from 'react';
import { Shield, Lock, TrendingUp, Calendar, Zap } from 'lucide-react';
import DayRing from './DayRing';
const SocialProof: React.FC = () => {
  const chips = [{
    icon: Lock,
    label: 'Private by default'
  }, {
    icon: TrendingUp,
    label: 'Serious finance'
  }, {
    icon: Calendar,
    label: 'Day-first design'
  }, {
    icon: Shield,
    label: 'No data selling'
  }, {
    icon: Zap,
    label: 'Fast & focused'
  }];
  return;
};
export default SocialProof;