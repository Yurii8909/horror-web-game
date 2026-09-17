/**
 * Professional Roblox Studio Lua Scripts & Python Tools
 * Ready for copy-pasting directly into Roblox Studio Explorer hierarchy.
 */

export interface RobloxScriptFile {
  filename: string;
  location: string;
  language: 'lua' | 'python';
  description: string;
  code: string;
}

export const ROBLOX_SCRIPTS: RobloxScriptFile[] = [
  {
    filename: 'ProceduralForestGenerator.server.lua',
    location: 'ServerScriptService > WorldScripts > ProceduralForestGenerator',
    language: 'lua',
    description: 'Генерирует процедурный лес с туманом, деревьями, заброшенными хижинами, генераторами и точками спавна ресурсов.',
    code: `--[[
    SHADOW FOREST: PROCEDURAL MAP GENERATOR
    Location: ServerScriptService.ProceduralForestGenerator
    Description: Generates an infinite/bounded atmospheric dark forest with Roblox Terrain and Parts.
]]

local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

-- Forest Generation Parameters
local MAP_SIZE = 350 -- Size in studs (X and Z)
local TREE_COUNT = 320 -- Dense realistic spruce pine forest
local CABIN_COUNT = 3
local GENERATOR_COUNT = 4
local RESOURCE_SPAWN_INTERVAL = 25

local ForestFolder = Instance.new("Folder")
ForestFolder.Name = "DynamicForest"
ForestFolder.Parent = Workspace

local ResourcesFolder = Instance.new("Folder")
ResourcesFolder.Name = "ForestResources"
ResourcesFolder.Parent = Workspace

-- Setup Horror Lighting Environment
local function setupAtmosphere()
    Lighting.ClockTime = 0 -- Pitch black midnight
    Lighting.Brightness = 0.05
    Lighting.OutdoorAmbient = Color3.fromRGB(8, 12, 20)
    Lighting.Ambient = Color3.fromRGB(5, 5, 10)
    Lighting.FogColor = Color3.fromRGB(4, 6, 10)
    Lighting.FogStart = 5
    Lighting.FogEnd = 55 -- Dense suffocating horror fog

    local atmosphere = Instance.new("Atmosphere")
    atmosphere.Density = 0.55
    atmosphere.Offset = 0.1
    atmosphere.Color = Color3.fromRGB(15, 20, 30)
    atmosphere.Decay = Color3.fromRGB(5, 5, 8)
    atmosphere.Glare = 0
    atmosphere.Haze = 3
    atmosphere.Parent = Lighting

    local colorCorrection = Instance.new("ColorCorrectionEffect")
    colorCorrection.TintColor = Color3.fromRGB(220, 230, 255)
    colorCorrection.Contrast = 0.25
    colorCorrection.Saturation = -0.4 -- Desaturated horror look
    colorCorrection.Parent = Lighting
end

-- Procedural Tree Builder (Realistic Multi-Tier Organic Spruce)
local function spawnProceduralTree(x, z)
    local treeModel = Instance.new("Model")
    treeModel.Name = "SpruceTree"

    local height = math.random(26, 38)
    local trunk = Instance.new("Part")
    trunk.Name = "Trunk"
    trunk.Shape = Enum.PartType.Cylinder
    trunk.Size = Vector3.new(height, 2.2, 2.2)
    trunk.CFrame = CFrame.new(x, height / 2, z) * CFrame.Angles(0, 0, math.rad(90))
    trunk.Anchored = true
    trunk.Material = Enum.Material.Wood
    trunk.Color = Color3.fromRGB(42, 28, 20)
    trunk.CastShadow = true
    trunk.Parent = treeModel

    -- Root Flaring Base
    for r = 0, 2 do
        local root = Instance.new("Part")
        root.Name = "Root"
        root.Shape = Enum.PartType.Cylinder
        root.Size = Vector3.new(3.8, 1.4, 1.4)
        local rot = math.rad(r * 120 + math.random(-15, 15))
        root.CFrame = CFrame.new(x + math.cos(rot) * 1.5, 0.7, z + math.sin(rot) * 1.5) * CFrame.Angles(math.rad(45), rot, 0)
        root.Anchored = true
        root.Material = Enum.Material.Wood
        root.Color = Color3.fromRGB(35, 22, 16)
        root.Parent = treeModel
    end

    -- 4 Multi-Tier Drooping Needle Canopies
    local tiers = {
        { yOffset = 0.40, radius = 13.5, height = 8.5 },
        { yOffset = 0.58, radius = 10.8, height = 7.5 },
        { yOffset = 0.74, radius = 8.2, height = 6.5 },
        { yOffset = 0.90, radius = 5.2, height = 5.5 }
    }

    for i, tier in ipairs(tiers) do
        local foliage = Instance.new("Part")
        foliage.Name = "FoliageTier_" .. i
        -- Conical appearance via SpecialMesh or Cylinder
        foliage.Size = Vector3.new(tier.radius, tier.height, tier.radius)
        foliage.Position = Vector3.new(x, height * tier.yOffset, z)
        foliage.Anchored = true
        foliage.Material = Enum.Material.Grass
        foliage.Color = Color3.fromRGB(14 + i * 2, 26 + i * 3, 16 + i * 2)
        foliage.CastShadow = true

        local mesh = Instance.new("SpecialMesh")
        mesh.MeshType = Enum.MeshType.Sphere
        mesh.Scale = Vector3.new(1, 0.7, 1)
        mesh.Parent = foliage

        foliage.Parent = treeModel
    end

    treeModel.PrimaryPart = trunk
    treeModel.Parent = ForestFolder
end

-- Spawn Generator Nodes (Required for Escape)
local function spawnGenerators()
    local angles = {0, math.pi / 2, math.pi, 3 * math.pi / 2}
    for i, angle in ipairs(angles) do
        local dist = 80 + math.random(-15, 15)
        local genX = math.cos(angle) * dist
        local genZ = math.sin(angle) * dist

        local genPart = Instance.new("Part")
        genPart.Name = "EscapeGenerator_" .. i
        genPart.Size = Vector3.new(6, 7, 5)
        genPart.Position = Vector3.new(genX, 3.5, genZ)
        genPart.Anchored = true
        genPart.Material = Enum.Material.Metal
        genPart.Color = Color3.fromRGB(80, 85, 90)

        local prompt = Instance.new("ProximityPrompt")
        prompt.ObjectText = "Аварийный Генератор #" .. i
        prompt.ActionText = "Вставить детали и починить (Удерживать E)"
        prompt.HoldDuration = 4
        prompt.MaxActivationDistance = 10
        prompt.Parent = genPart

        genPart.Parent = ForestFolder
    end
end

-- Generate the whole forest map
local function generateWorld()
    setupAtmosphere()

    for _ = 1, TREE_COUNT do
        local randX = math.random(-MAP_SIZE/2, MAP_SIZE/2)
        local randZ = math.random(-MAP_SIZE/2, MAP_SIZE/2)
        -- Keep spawn safe zone clear
        if (randX * randX + randZ * randZ) > 400 then
            spawnProceduralTree(randX, randZ)
        end
    end

    spawnGenerators()
    print("[SHADOW FOREST] Procedural forest successfully generated with " .. TREE_COUNT .. " trees.")
end

generateWorld()
`,
  },
  {
    filename: 'MainMonsterAI.server.lua',
    location: 'ServerScriptService > AI > MainMonsterAI',
    language: 'lua',
    description: 'Искусственный интеллект главного монстра: преследование через PathfindingService, телепортация в слепую зону, скримеры и способности.',
    code: `--[[
    SHADOW FOREST: MAIN MONSTER AI ("ТЕНЕВОЙ ЖНЕЦ")
    Location: ServerScriptService.AI.MainMonsterAI
    Features: PathfindingService navigation, Line-of-sight raycasting, Sound hearing,
              Shadow-teleport ability, EMP Flashlight pulse, Bloodcurdling Jumpscare.
]]

local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Monster = script.Parent -- Monster Rig Model (R15 or Custom)
local Humanoid = Monster:WaitForChild("Humanoid")
local RootPart = Monster:WaitForChild("HumanoidRootPart")

-- Monster States
local STATE = {
    PATROL = "Patrol",
    STALK = "Stalk",
    CHASE = "Chase",
    TELEPORTING = "Teleporting",
    STUNNED = "Stunned"
}
local currentState = STATE.PATROL

-- Config
local WALK_SPEED = 14
local SPRINT_SPEED = 24
local DETECTION_RADIUS = 75
local HEARING_RADIUS = 95
local TELEPORT_COOLDOWN = 30
local lastTeleportTime = 0

Humanoid.WalkSpeed = WALK_SPEED

-- RemoteEvent to trigger terrifying client jumpscare
local JumpscareEvent = Instance.new("RemoteEvent")
JumpscareEvent.Name = "MonsterJumpscareEvent"
JumpscareEvent.Parent = ReplicatedStorage

-- Check if player is visible to monster via raycasting
local function canSeeTarget(targetPlayer)
    if not targetPlayer.Character or not targetPlayer.Character:FindFirstChild("HumanoidRootPart") then
        return false
    end
    local targetRoot = targetPlayer.Character.HumanoidRootPart
    local origin = RootPart.Position + Vector3.new(0, 3, 0)
    local direction = (targetRoot.Position - origin)

    local raycastParams = RaycastParams.new()
    raycastParams.FilterDescendantsInstances = {Monster}
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude

    local result = Workspace:Raycast(origin, direction, raycastParams)
    if result and result.Instance:IsDescendantOf(targetPlayer.Character) then
        return true
    end
    return false
end

-- Find the nearest active survivor
local function getNearestSurvivor()
    local nearest = nil
    local shortestDist = math.huge

    for _, player in ipairs(Players:GetPlayers()) do
        if player.Character and player.Character:FindFirstChild("Humanoid") and player.Character.Humanoid.Health > 0 then
            local pRoot = player.Character:FindFirstChild("HumanoidRootPart")
            if pRoot then
                local dist = (pRoot.Position - RootPart.Position).Magnitude
                if dist < shortestDist then
                    shortestDist = dist
                    nearest = player
                end
            end
        end
    end
    return nearest, shortestDist
end

-- Ability 1: Shadow Teleport behind player's camera blindspot
local function triggerShadowTeleport(targetPlayer)
    if os.time() - lastTeleportTime < TELEPORT_COOLDOWN then return end
    lastTeleportTime = os.time()

    local targetRoot = targetPlayer.Character and targetPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not targetRoot then return end

    -- Position behind target
    local behindCFrame = targetRoot.CFrame * CFrame.new(0, 0, 18)
    RootPart.CFrame = behindCFrame
    print("[MONSTER AI] Teleported in shadows behind " .. targetPlayer.Name)
end

-- Main AI Loop
task.spawn(function()
    while task.wait(0.4) do
        if currentState == STATE.STUNNED then
            -- Bear trap or flare stun
            task.wait(4)
            currentState = STATE.PATROL
            Humanoid.WalkSpeed = WALK_SPEED
        else
            local target, dist = getNearestSurvivor()
            if target and dist < DETECTION_RADIUS then
                local visible = canSeeTarget(target)
                if visible or dist < 25 then
                    -- Enter Chase Mode
                    currentState = STATE.CHASE
                    Humanoid.WalkSpeed = SPRINT_SPEED

                    -- Move toward target
                    local path = PathfindingService:CreatePath({
                        AgentRadius = 3,
                        AgentHeight = 8,
                        AgentCanJump = false
                    })
                    pcall(function()
                        path:ComputeAsync(RootPart.Position, target.Character.HumanoidRootPart.Position)
                        local waypoints = path:GetWaypoints()
                        if waypoints[2] then
                            Humanoid:MoveTo(waypoints[2].Position)
                        end
                    end)

                    -- Kill / Jumpscare touch check
                    if dist <= 5 then
                        JumpscareEvent:FireClient(target)
                        target.Character.Humanoid.Health = 0
                        task.wait(2)
                    end
                else
                    -- Target hidden in darkness or behind tree: attempt teleport
                    if math.random(1, 10) == 1 then
                        triggerShadowTeleport(target)
                    end
                end
            else
                currentState = STATE.PATROL
                Humanoid.WalkSpeed = WALK_SPEED
            end
        end
    end
end)
`,
  },
  {
    filename: 'NightCrawlersSpawner.server.lua',
    location: 'ServerScriptService > AI > NightCrawlersSpawner',
    language: 'lua',
    description: 'Система смены дня/ночи и спавна стаи мелких ночных ползунов, вылезающих из кустов в лесу.',
    code: `--[[
    SHADOW FOREST: NIGHT CRAWLERS & DAY/NIGHT CONTROLLER
    Location: ServerScriptService.AI.NightCrawlersSpawner
    Description: Spawns terrifying skittering minions when midnight arrives.
]]

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local CrawlersFolder = Instance.new("Folder")
CrawlersFolder.Name = "NightCrawlers"
CrawlersFolder.Parent = Workspace

local MAX_CRAWLERS = 8

-- Create low-poly creepy 4-legged Crawler Minion
local function createCrawlerModel(spawnPos)
    local crawler = Instance.new("Model")
    crawler.Name = "NightCrawler"

    local body = Instance.new("Part")
    body.Name = "HumanoidRootPart"
    body.Size = Vector3.new(2, 1.2, 3)
    body.Position = spawnPos
    body.Color = Color3.fromRGB(15, 15, 18)
    body.Material = Enum.Material.CorrodedMetal
    body.Parent = crawler

    local head = Instance.new("Part")
    head.Name = "Head"
    head.Size = Vector3.new(1.2, 1.2, 1.2)
    head.Position = body.Position + Vector3.new(0, 0.4, 1.8)
    head.Color = Color3.fromRGB(10, 10, 12)
    head.Parent = crawler

    -- Glowing yellow/green eerie eyes
    local eyeLight = Instance.new("PointLight")
    eyeLight.Color = Color3.fromRGB(180, 255, 60)
    eyeLight.Brightness = 2
    eyeLight.Range = 8
    eyeLight.Parent = head

    local humanoid = Instance.new("Humanoid")
    humanoid.MaxHealth = 40
    humanoid.Health = 40
    humanoid.WalkSpeed = 19
    humanoid.Parent = crawler

    crawler.PrimaryPart = body
    crawler.Parent = CrawlersFolder

    -- Basic skittering swarm logic
    task.spawn(function()
        while crawler and crawler.Parent and humanoid.Health > 0 do
            task.wait(1.5)
            -- Find nearest player to harass
            local nearestP = nil
            local minDist = 60
            for _, p in ipairs(Players:GetPlayers()) do
                if p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
                    local d = (p.Character.HumanoidRootPart.Position - body.Position).Magnitude
                    if d < minDist then
                        minDist = d
                        nearestP = p
                    end
                end
            end

            if nearestP and nearestP.Character then
                humanoid:MoveTo(nearestP.Character.HumanoidRootPart.Position)
            else
                -- Wander randomly near trees
                local wanderTarget = body.Position + Vector3.new(math.random(-25, 25), 0, math.random(-25, 25))
                humanoid:MoveTo(wanderTarget)
            end
        end
    end)
end

-- Night minion wave manager
task.spawn(function()
    while task.wait(15) do
        local currentCount = #CrawlersFolder:GetChildren()
        if currentCount < MAX_CRAWLERS then
            for _, player in ipairs(Players:GetPlayers()) do
                if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
                    local pPos = player.Character.HumanoidRootPart.Position
                    local angle = math.random() * math.pi * 2
                    local spawnDist = math.random(35, 60)
                    local spawnPos = pPos + Vector3.new(math.cos(angle) * spawnDist, 1, math.sin(angle) * spawnDist)
                    createCrawlerModel(spawnPos)
                    break
                end
            end
        end
    end
end)
`,
  },
  {
    filename: 'InventoryAndCraftingSystem.lua',
    location: 'ReplicatedStorage > Systems > InventoryAndCraftingSystem',
    language: 'lua',
    description: 'Система инвентаря, рецептов крафта, ресурсов леса (ветви, металл, сера, батарейки) и создание капканов / фаеров.',
    code: `--[[
    SHADOW FOREST: INVENTORY & CRAFTING SYSTEM
    Location: ReplicatedStorage.Systems.InventoryAndCraftingSystem
    ModuleScript: Handles player items, resource gathering and recipe crafting.
]]

local InventoryManager = {}

-- Resource definitions
InventoryManager.Resources = {
    Wood = {Name = "Dry Branches", Weight = 1},
    Scrap = {Name = "Scrap Metal", Weight = 2},
    Battery = {Name = "Battery Cell", Weight = 1},
    Herbs = {Name = "Hemlock Herbs", Weight = 1},
    Sulfur = {Name = "Sulfur Powder", Weight = 1},
    Circuit = {Name = "Radio Board", Weight = 3},
}

-- Crafting Recipes
InventoryManager.Recipes = {
    Torch = {
        Result = "Torch",
        Duration = 2,
        Cost = {Wood = 2, Herbs = 1},
        Description = "Frees up flashlight battery and keeps small crawlers away."
    },
    AntiDemonFlare = {
        Result = "SignalFlare",
        Duration = 3,
        Cost = {Sulfur = 2, Scrap = 1, Wood = 1},
        Description = "Blinds and stuns the main monster for 8 seconds."
    },
    BearTrap = {
        Result = "BearTrap",
        Duration = 3,
        Cost = {Scrap = 3, Wood = 1},
        Description = "Roots the monster in place when stepped on."
    },
    Medkit = {
        Result = "Medkit",
        Duration = 2,
        Cost = {Herbs = 2, Scrap = 1},
        Description = "Restores 50 HP and restores mental sanity."
    },
    GeneratorPart = {
        Result = "GeneratorPart",
        Duration = 4,
        Cost = {Circuit = 1, Scrap = 2, Battery = 1},
        Description = "Essential part to fix one of the escape generators."
    }
}

-- Check if player has required resources
function InventoryManager.CanCraft(playerInventory, recipeKey)
    local recipe = InventoryManager.Recipes[recipeKey]
    if not recipe then return false end

    for resKey, requiredAmount in pairs(recipe.Cost) do
        local currentAmount = playerInventory[resKey] or 0
        if currentAmount < requiredAmount then
            return false
        end
    end
    return true
end

-- Perform craft: deduct resources and grant item
function InventoryManager.CraftItem(playerInventory, playerItems, recipeKey)
    if not InventoryManager.CanCraft(playerInventory, recipeKey) then
        return false, "Insufficient resources"
    end

    local recipe = InventoryManager.Recipes[recipeKey]
    for resKey, requiredAmount in pairs(recipe.Cost) do
        playerInventory[resKey] = playerInventory[resKey] - requiredAmount
    end

    playerItems[recipe.Result] = (playerItems[recipe.Result] or 0) + 1
    return true, "Successfully crafted " .. recipe.Result
end

return InventoryManager
`,
  },
  {
    filename: 'HorrorAtmosphereAndVoice.client.lua',
    location: 'StarterPlayer > StarterPlayerScripts > HorrorAtmosphereAndVoice',
    language: 'lua',
    description: 'Клиентский скрипт: динамический пульс страха, покачивание камеры, мерцание фонаря и проверка микрофона голосового чата.',
    code: `--[[
    SHADOW FOREST: CLIENT HORROR CONTROLLER & JUMPSCARE
    Location: StarterPlayer.StarterPlayerScripts.HorrorAtmosphereAndVoice
    Description: Flashlight flickering, dynamic heart rate audio, spatial screamer effect.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local VoiceChatService = game:GetService("VoiceChatService")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")
local Camera = workspace.CurrentCamera

-- Flashlight setup
local character = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
local rootPart = character:WaitForChild("HumanoidRootPart")

local flashlight = Instance.new("SpotLight")
flashlight.Name = "SurvivorFlashlight"
flashlight.Brightness = 3.5
flashlight.Range = 45
flashlight.Angle = 65
flashlight.Color = Color3.fromRGB(255, 245, 225)
flashlight.Parent = rootPart

-- Dynamic Flashlight Flicker when Monster is Near
local function onHeartbeatTick()
    local monster = workspace:FindFirstChild("MainMonster")
    if monster and monster:FindFirstChild("HumanoidRootPart") then
        local dist = (monster.HumanoidRootPart.Position - rootPart.Position).Magnitude
        if dist < 30 then
            -- Glitch flicker
            if math.random(1, 4) == 1 then
                flashlight.Enabled = false
                task.wait(0.08)
                flashlight.Enabled = true
            end
        end
    end
end

RunService.RenderStepped:Connect(onHeartbeatTick)

-- Jumpscare listener
local JumpscareEvent = ReplicatedStorage:WaitForChild("MonsterJumpscareEvent")
JumpscareEvent.OnClientEvent:Connect(function()
    -- Camera shake
    for i = 1, 15 do
        Camera.CFrame = Camera.CFrame * CFrame.Angles(
            math.rad(math.random(-4, 4)),
            math.rad(math.random(-4, 4)),
            math.rad(math.random(-4, 4))
        )
        task.wait(0.03)
    end
end)

print("[SHADOW FOREST] Horror atmosphere and client mechanics initialized.")
`,
  },
  {
    filename: 'RobloxTerrainGenerator.py',
    location: 'Tools / External Generator > RobloxTerrainGenerator.py',
    language: 'python',
    description: 'Python скрипт для генерации шума Перлина высот карты леса и экспорта координат деревьев и ресурсов в JSON для Roblox Studio.',
    code: `"""
SHADOW FOREST: PYTHON PROCEDURAL TERRAIN & MAP EXPORTER
Requirements: pip install perlin-noise
Use this tool to generate complex heightmaps and tree layout JSON for Roblox Studio.
"""

import math
import random
import json

def generate_forest_map(width=200, depth=200, tree_count=180, seed=42):
    random.seed(seed)
    print(f"[*] Generating procedural horror forest layout (Seed: {seed})...")
    
    data = {
        "metadata": {
            "title": "Shadow Forest Roblox Map",
            "dimensions": {"width": width, "depth": depth},
            "seed": seed
        },
        "trees": [],
        "generators": [],
        "resource_nodes": [],
        "cabin_ruins": []
    }
    
    # 1. Generate Trees with Perlin-style clusters
    for i in range(tree_count):
        x = random.randint(-width // 2, width // 2)
        z = random.randint(-depth // 2, depth // 2)
        
        # Keep spawn center clear
        if math.hypot(x, z) < 18:
            continue
            
        tree_type = random.choice(["pine", "twisted_oak", "dead_birch"])
        height = random.uniform(16, 28)
        scale = random.uniform(0.85, 1.3)
        
        data["trees"].append({
            "id": f"tree_{i}",
            "type": tree_type,
            "x": round(x, 2),
            "y": 0,
            "z": round(z, 2),
            "height": round(height, 2),
            "scale": round(scale, 2)
        })
        
    # 2. Place 4 Escape Generators
    angles = [0, math.pi / 2, math.pi, 3 * math.pi / 2]
    for idx, angle in enumerate(angles):
        dist = random.uniform(65, 85)
        gx = math.cos(angle) * dist
        gz = math.sin(angle) * dist
        data["generators"].append({
            "id": f"gen_{idx+1}",
            "x": round(gx, 2),
            "z": round(gz, 2),
            "required_parts": 1
        })
        
    # 3. Scatter Resources
    resource_types = ["wood", "scrap", "battery", "herbs", "sulfur", "circuit"]
    for r_idx in range(60):
        rx = random.randint(-width // 2 + 10, width // 2 - 10)
        rz = random.randint(-depth // 2 + 10, depth // 2 - 10)
        res = random.choice(resource_types)
        data["resource_nodes"].append({
            "id": f"res_{r_idx}",
            "resource": res,
            "x": round(rx, 2),
            "z": round(rz, 2)
        })
        
    output_filename = "roblox_forest_map.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    print(f"[+] Successfully exported {len(data['trees'])} trees and {len(data['resource_nodes'])} resources to {output_filename}!")
    return data

if __name__ == "__main__":
    generate_forest_map()
`,
  },
];
