import { useMemo, useState } from 'react';
import type { AIClothingDesign, MaqasaqRecommendation } from '../../../types';
import { fabricsList, printingMethods } from '../../../data';

export function useAiStudio(onAddCustomToCart: (customDesign: AIClothingDesign, size: string) => void) {
    const [activeStep, setActiveStep] = useState(1);
    const [prompt, setPrompt] = useState('Fatimid octagonal stars intersecting with luxurious gold calligraphic brushstrokes');
    const [clothingType, setClothingType] = useState<'Hoodie' | 'T-Shirt' | 'Abaya' | 'Jacket' | 'Streetwear'>('Abaya');
    const [flavorPreset, setFlavorPreset] = useState('Islamic Geometry');
    const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
    const [isGeneratingPattern, setIsGeneratingPattern] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [activeDesign, setActiveDesign] = useState<AIClothingDesign>({
        prompt: 'Fatimid octagonal stars intersecting with luxurious gold calligraphic brushstrokes',
        clothingType: 'Abaya',
        primaryColor: '#0A0F2C',
        svgPattern: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0A0F2C"/>
      <circle cx="50" cy="50" r="40" stroke="#C9A84C" stroke-width="0.75" stroke-dasharray="2,2"/>
      <polygon points="50,14 61,39 86,50 61,61 50,86 39,61 14,50 39,39" stroke="#4FC3F7" stroke-width="1" fill="none"/>
      <circle cx="50" cy="50" r="10" stroke="#C9A84C" stroke-width="0.5"/>
      <path d="M 50,32 C 55,40 55,60 50,68 C 45,60 45,40 50,32 Z" fill="#F0D080" opacity="0.8"/>
    </svg>`,
        accentColor: '#C9A84C',
        patternName: 'Fatimid Imperial Geometry',
        description: 'Intricately detailed Fatimid geometries merged with modern flowing drapes.',
        story: 'Woven under Alexandria’s golden sea dusk, this design traces Fatimid architectural star patterns. It represents geometric perfection aligned with calligraphy rhythms.',
        fabrics: ['Premium Mulberry Silk', 'Luxury Italian Velvet'],
        printingOption: 'Embroidery (Gold Thread)'
    });
    const [selectedFabric, setSelectedFabric] = useState<string>(fabricsList[0].name);
    const [selectedPrinting, setSelectedPrinting] = useState<string>(printingMethods[0].name);
    const [baseColor, setBaseColor] = useState('#0A0F2C');
    const [mockupAngle, setMockupAngle] = useState<'front' | 'back'>('front');
    const [height, setHeight] = useState('178');
    const [weight, setWeight] = useState('72');
    const [gender, setGender] = useState('Women');
    const [posture, setPosture] = useState('Fluid Grace fit');
    const [isCalculatingSize, setIsCalculatingSize] = useState(false);
    const [sizeRecommendation, setSizeRecommendation] = useState<MaqasaqRecommendation>({
        size: 'M',
        confidence: 97.4,
        measurements: { chest: 96, shoulder: 41, length: 135, waist: 78 },
        comment: 'Maqasaq tailors recommend size M. Ideal drape alignment calculated across shoulders. Fabric maps perfectly to mulberry silk fluidity.'
    });

    const presets = useMemo(() => [
        { name: 'Islamic Geometry', text: 'Classic Byzantine octagrams, intricate symmetric star grids, thin golden lines, interlocking medallions' },
        { name: 'Cairo Art Deco', text: 'Gilded Egyptian Art Deco vertical grids, sandy ivory blocks, overlapping copper structures and stylized lilies' },
        { name: 'Gilded Calligraphy', text: 'Sweeping Diwani calligraphic verses in 18k liquid gold ink brush strokes, flowing randomly on deep velvet' },
        { name: 'Alexandrian Inlay', text: 'Geometric mother-of-pearl (Sadaf) mosaic triangles, saltwater shell textures, crystal blue iridescent lines' }
    ], []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setUploadedBase64(reader.result as string);
            setPrompt(`Fusing uploaded textile photo with premium gold drapes on standard ${clothingType}`);
        };
        reader.readAsDataURL(file);
    };

    const applyPreset = (preset: (typeof presets)[number]) => {
        setFlavorPreset(preset.name);
        setPrompt(preset.text);
    };

    const handleGenerateDesign = async () => {
        setIsGeneratingPattern(true);
        setGenerationError(null);
        try {
            const response = await fetch('/api/gemini/generate-pattern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, clothingType, styleModifier: flavorPreset })
            });
            if (!response.ok) throw new Error('Server responded with error status');
            const data = await response.json();
            setActiveDesign({
                prompt,
                clothingType,
                primaryColor: data.primaryColor || '#0A0F2C',
                svgPattern: data.customSvg,
                accentColor: data.accentColor || '#C9A84C',
                patternName: data.patternName || 'Imperial Symmetrical Geometry',
                description: data.description || 'Sophisticated high-contrast textile pattern.',
                story: data.story || 'A tale of cultural resonance woven on modern silhouettes.',
                fabrics: data.matchingFabrics || ['Luxury Italian Velvet'],
                printingOption: data.printingOption || 'Embroidery (Gold Thread)'
            });
            setBaseColor(data.primaryColor || '#0A0F2C');
            setActiveStep(2);
        } catch (error) {
            console.error(error);
            setGenerationError('Failed to reach Gemini creative pipeline. Running high-integrity backup loop.');
        } finally {
            setIsGeneratingPattern(false);
        }
    };

    const handleCalculateSize = async () => {
        setIsCalculatingSize(true);
        try {
            const response = await fetch('/api/maqasaq/size-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ height, weight, gender, posture })
            });
            if (!response.ok) throw new Error('Advisor unreachable');
            const data = await response.json();
            setSizeRecommendation({
                size: data.size,
                confidence: data.confidence,
                measurements: data.measurements,
                comment: data.comment
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsCalculatingSize(false);
        }
    };

    const dispatchToCoutureAtelier = () => {
        const finalPersonalizedDesign: AIClothingDesign = {
            ...activeDesign,
            primaryColor: baseColor,
            printingOption: selectedPrinting as AIClothingDesign['printingOption'],
            fabrics: [selectedFabric, ...activeDesign.fabrics]
        };
        onAddCustomToCart(finalPersonalizedDesign, sizeRecommendation.size);
        alert(`Bespoke Customized ${clothingType} added to your Couture Bag. Manufacturing will commence in Cairo Atelier according to recommended sizing.`);
    };

    return {
        activeStep,
        setActiveStep,
        prompt,
        setPrompt,
        clothingType,
        setClothingType,
        flavorPreset,
        setFlavorPreset,
        uploadedBase64,
        isGeneratingPattern,
        generationError,
        activeDesign,
        setActiveDesign,
        selectedFabric,
        setSelectedFabric,
        selectedPrinting,
        setSelectedPrinting,
        baseColor,
        setBaseColor,
        mockupAngle,
        setMockupAngle,
        height,
        setHeight,
        weight,
        setWeight,
        gender,
        setGender,
        posture,
        setPosture,
        isCalculatingSize,
        sizeRecommendation,
        presets,
        handleImageUpload,
        applyPreset,
        handleGenerateDesign,
        handleCalculateSize,
        dispatchToCoutureAtelier
    };
}
