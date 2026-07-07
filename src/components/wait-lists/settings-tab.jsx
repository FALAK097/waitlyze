"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./general-settings-tab";
import { SocialSettingsTab } from "./social-settings-tab";

export function SettingsTab({ formSettings, updateSetting, applyPreset }) {
	return (
		<div className="w-full md:w-80 ml-0 px-4 md:ml-8 h-[calc(100vh-200px)] overflow-y-auto">
			<Tabs defaultValue="general" className="w-full">
				<TabsList>
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="input">Input</TabsTrigger>
					<TabsTrigger value="presets">Presets</TabsTrigger>
					<TabsTrigger value="social">Social</TabsTrigger>
				</TabsList>
				<GeneralSettingsTab formSettings={formSettings} updateSetting={updateSetting} />
				<TabsContent value="input" className="py-4 space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="inputColor">Input Color</Label>
						<ColorPicker
							id="inputColor"
							value={formSettings.inputColor}
							onChange={(color) => updateSetting("inputColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputBorder">Input Border</Label>
						<ColorPicker
							id="inputBorder"
							value={formSettings.inputBorder}
							onChange={(color) => updateSetting("inputBorder", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputTextColor">Input Text Color</Label>
						<ColorPicker
							id="inputTextColor"
							value={formSettings.inputTextColor}
							onChange={(color) => updateSetting("inputTextColor", color)}
						/>
					</div>
					<div>
						<Label htmlFor="placeholderText">Placeholder Text</Label>
						<Input
							id="placeholderText"
							value={formSettings.placeholderText}
							onChange={(e) => updateSetting("placeholderText", e.target.value)}
						/>
					</div>
				</TabsContent>
				<TabsContent value="presets" className="py-4 space-y-4">
					<Button
						className="w-full"
						style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF" }}
						onClick={() => applyPreset("modern")}
					>
						Modern
					</Button>
					<Button
						className="w-full"
						style={{ backgroundColor: "#FF4136", color: "#FFFFFF" }}
						onClick={() => applyPreset("hot")}
					>
						Hot
					</Button>
					<Button
						className="w-full"
						style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
						onClick={() => applyPreset("minimal")}
					>
						Minimal
					</Button>
					<Button
						className="w-full"
						style={{
							backgroundColor: "#FFB6C1",
							color: "#000000",
							border: "2px solid #000000",
						}}
						onClick={() => applyPreset("funk")}
					>
						Funk
					</Button>
				</TabsContent>
				<SocialSettingsTab formSettings={formSettings} updateSetting={updateSetting} />
			</Tabs>
		</div>
	);
}
