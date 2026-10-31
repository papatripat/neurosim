export type Gender = 'male' | 'female';
export type BodyType = 'standard' | 'muscular' | 'slender';
export type CharacterDirection = 'south' | 'north' | 'west' | 'east';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface SelectOption {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface CharacterCustomization {
  name: string;
  gender: Gender;
  bodyType: BodyType;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  facialHair: string;
  glasses: string;
  shirtType: string;
  shirtColor: string;
  suitType: string;
  suitColor: string;
  tieType: string;
  tieColor: string;
  pantsType: string;
  pantsColor: string;
  shoesType: string;
  shoesColor: string;
  accessory: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  config: CharacterCustomization;
}

