"use client";
import { useState } from "react";
import {
    ReactCompareSlider,
    ReactCompareSliderImage,
} from "react-compare-slider";

type Props = {
    firstImage: string;
    secondImage: string;
};

const ImageCompareDisplay = ({ firstImage, secondImage }: Props) => {
    const [positionEnum, setPositionEnum] = useState<
        "LEFT" | "RIGHT" | "IN_BETWEEN"
    >("IN_BETWEEN");
    return (
        <div className="relative group w-full h-full">
            {positionEnum !== "LEFT" && (
                <div className="absolute group-hover:hidden left-4 top-1/2 bg-violet-600 py-1.5 px-3 rounded-full font-medium z-50 text-white select-none text-xs shadow-md">
                    Before
                </div>
            )}
            {positionEnum !== "RIGHT" && (
                <div className="absolute group-hover:hidden right-4 top-1/2 bg-violet-600 py-1.5 px-3 rounded-full font-medium z-50 text-white select-none text-xs shadow-md">
                    After
                </div>
            )}
            <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={firstImage} alt="Input Image" className="object-cover" />}
                itemTwo={
                    <ReactCompareSliderImage src={secondImage} alt="Output Image" className="object-cover" />
                }
                onPositionChange={(position) => {
                    if (position < 10) setPositionEnum("LEFT");
                    else if (position > 90) setPositionEnum("RIGHT");
                    else setPositionEnum("IN_BETWEEN");
                }}
                className="w-full h-full rounded-lg"
            />
        </div>
    );
};

export default ImageCompareDisplay;
