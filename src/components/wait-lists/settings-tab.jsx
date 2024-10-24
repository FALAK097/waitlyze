import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "../ui/color-picker";
import UploadImage from "../upload-image";

export function SettingsTab({ formSettings, updateSetting, applyPreset }) {
	return (
		<div className="w-80 px-4 ml-8 h-[calc(100vh-200px)] overflow-y-auto">
			<Tabs defaultValue="general" className="w-full">
				<TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="input">Input</TabsTrigger>
					<TabsTrigger value="presets">Presets</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="space-y-4">
					<div>
						<Label htmlFor="logoUrl">Logo</Label>
						<UploadImage
							onSuccess={(files) => {
								updateSetting("logoUrl", files[0].url);
								updateSetting("logoKey", files[0].key);
							}}
						/>
					</div>
					<div>
						<Label htmlFor="buttonColor">Button Color</Label>
						<ColorPicker
							value={formSettings.buttonColor}
							onChange={(color) => updateSetting("buttonColor", color)}
						/>
					</div>
					<div>
						<Label htmlFor="buttonBorder">Button Border</Label>
						<Input
							id="buttonBorder"
							type="color"
							value={formSettings.buttonBorder}
							onChange={(e) => updateSetting("buttonBorder", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="buttonTextColor">Button Text Color</Label>
						<Input
							id="buttonTextColor"
							type="color"
							value={formSettings.buttonTextColor}
							onChange={(e) => updateSetting("buttonTextColor", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="bgColor">BG Color</Label>
						<Input
							id="bgColor"
							type="color"
							value={formSettings.bgColor}
							onChange={(e) => updateSetting("bgColor", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="borderWidth">Border Width</Label>
						<Select
							value={formSettings.borderWidth}
							onValueChange={(value) => updateSetting("borderWidth", value)}
						>
							<SelectTrigger id="borderWidth">
								<SelectValue placeholder="Select border width" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0px">0px</SelectItem>
								<SelectItem value="1px">1px</SelectItem>
								<SelectItem value="2px">2px</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="borderRadius">Border Radius</Label>
						<Select
							value={formSettings.borderRadius}
							onValueChange={(value) => updateSetting("borderRadius", value)}
						>
							<SelectTrigger id="borderRadius">
								<SelectValue placeholder="Select border radius" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="small">Small</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="large">Large</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="fontWeight">Font Weight</Label>
						<Select
							value={formSettings.fontWeight}
							onValueChange={(value) => updateSetting("fontWeight", value)}
						>
							<SelectTrigger id="fontWeight">
								<SelectValue placeholder="Select font weight" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="bold">Bold</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="logoSize">Logo Size</Label>
						<Select
							value={formSettings.logoSize}
							onValueChange={(value) => updateSetting("logoSize", value)}
						>
							<SelectTrigger id="logoSize">
								<SelectValue placeholder="Select logo size" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1X">1X</SelectItem>
								<SelectItem value="2X">2X</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="buttonText">Button Text</Label>
						<Input
							id="buttonText"
							value={formSettings.buttonText}
							onChange={(e) => updateSetting("buttonText", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="successMessage">Success Message</Label>
						<Input
							id="successMessage"
							value={formSettings.successMessage}
							onChange={(e) => updateSetting("successMessage", e.target.value)}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showLogo"
							checked={formSettings.showLogo}
							onCheckedChange={(checked) => updateSetting("showLogo", checked)}
						/>
						<Label htmlFor="showLogo">Show Logo</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showSocialProof"
							checked={formSettings.showSocialProof}
							onCheckedChange={(checked) =>
								updateSetting("showSocialProof", checked)
							}
						/>
						<Label htmlFor="showSocialProof">Show Social Proof</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="enableReferrals"
							checked={formSettings.enableReferrals}
							onCheckedChange={(checked) =>
								updateSetting("enableReferrals", checked)
							}
						/>
						<Label htmlFor="enableReferrals">Enable Referrals</Label>
					</div>
				</TabsContent>
				<TabsContent value="input" className="space-y-4">
					<div>
						<Label htmlFor="inputColor">Input Color</Label>
						<Input
							id="inputColor"
							type="color"
							value={formSettings.inputColor}
							onChange={(e) => updateSetting("inputColor", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="inputBorder">Input Border</Label>
						<Input
							id="inputBorder"
							type="color"
							value={formSettings.inputBorder}
							onChange={(e) => updateSetting("inputBorder", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="inputTextColor">Input Text Color</Label>
						<Input
							id="inputTextColor"
							type="color"
							value={formSettings.inputTextColor}
							onChange={(e) => updateSetting("inputTextColor", e.target.value)}
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
				<TabsContent value="presets" className="space-y-4">
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
			</Tabs>
		</div>
	);
}
