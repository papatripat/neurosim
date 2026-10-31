extends Node2D

var manifest: Dictionary
var ground: Texture2D
var props: Texture2D
var actors: Array = []
var selected: int = 0
var images: Dictionary = {}
var clips: Dictionary = {}
const STARTS: Array = [Vector2(397,146),Vector2(54,177),Vector2(222,130),Vector2(398,337),Vector2(212,282),Vector2(313,320)]
const ROOM_IDS: Array = [1,0,0,2,0,2]
const BACK: Array = ["wall-window","wall-art","wall-clock","rug"]

func _ready() -> void:
    manifest = JSON.parse_string(FileAccess.get_file_as_string("res://manifest.json"))
    ground = load("res://art/rooms-ground.png")
    props = load("res://art/props/props.png")
    for c in manifest.characters:
        var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://"+c.aligned_metadata))
        images[c.slug] = load("res://"+data.image)
        clips[c.slug] = data
    _reset()
    if "--self-check" in OS.get_cmdline_user_args(): _self_check()

func _reset() -> void:
    actors.clear()
    for i in range(6): actors.append({"position":STARTS[i],"direction":"south","action":"idle","time":0.0})
    queue_redraw()

func _unhandled_key_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_TAB: selected = (selected+1)%actors.size()
        elif event.keycode == KEY_R: _reset()

func _move_actor(index: int, motion: Vector2) -> void:
    var room: Array = manifest.rooms[ROOM_IDS[index]].rect
    var p: Vector2 = actors[index].position+motion
    p.x = clampf(p.x,room[0]+14,room[0]+room[2]-14)
    p.y = clampf(p.y,room[1]+44,room[1]+room[3]-8)
    actors[index].position = p

func _transition(index: int, action: String, direction: String) -> void:
    var actor: Dictionary = actors[index]
    if actor.action == action and actor.direction == direction: return
    actor.action = action
    actor.direction = direction
    actor.time = 0.0
    if action == "walk":
        var slug: String = manifest.characters[index].slug
        actor.time = clips[slug].transitions.walk_entry_frame[direction]*0.1

func _process(delta: float) -> void:
    var move := Vector2.ZERO
    if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): move.x -= 1
    if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): move.x += 1
    if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): move.y -= 1
    if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): move.y += 1
    for i in range(actors.size()):
        if i != selected or move == Vector2.ZERO: _transition(i,"idle",actors[i].direction)
        actors[i].time += delta
    if move != Vector2.ZERO:
        var direction: String = ("east" if move.x>0 else "west") if absf(move.x)>absf(move.y) else ("south" if move.y>0 else "north")
        _transition(selected,"walk",direction)
        _move_actor(selected,move.normalized()*28.0*delta)
    queue_redraw()

func _frame(index: int) -> Rect2:
    var a: Dictionary = actors[index]
    var slug: String = manifest.characters[index].slug
    var clip: Dictionary = clips[slug].clips[a.action+"_"+a.direction]
    var phase: int = int(a.time*1000)%int(clip.cycle_ms)
    for f in clip.frames:
        if phase < int(f.duration_ms): return Rect2(f.rect[0],f.rect[1],64,64)
        phase -= int(f.duration_ms)
    return Rect2(0,0,64,64)

func _prop(p: Dictionary) -> void:
    for v in manifest.props:
        if v.name == p.name:
            var r: Array = v.rect
            draw_texture_rect_region(props,Rect2(p.x-32,p.y-58,64,64),Rect2(r[0],r[1],64,64))
            return

func _draw() -> void:
    if actors.is_empty(): return
    draw_texture(ground,Vector2.ZERO)
    var items: Array = []
    for p in manifest.prop_placements:
        if p.name in BACK: _prop(p)
        else: items.append({"y":p.y,"kind":"prop","value":p})
    for i in range(actors.size()): items.append({"y":actors[i].position.y,"kind":"actor","value":i})
    items.sort_custom(func(a: Dictionary,b: Dictionary) -> bool: return a.y < b.y)
    for item in items:
        if item.kind == "prop": _prop(item.value)
        else:
            var i: int = item.value
            var slug: String = manifest.characters[i].slug
            var pos: Vector2 = (actors[i].position-Vector2(32,54)).round()
            draw_texture_rect_region(images[slug],Rect2(pos,Vector2(64,64)),_frame(i))
    var foot: Vector2 = actors[selected].position.round()
    draw_line(foot+Vector2(-5,3),foot+Vector2(5,3),Color("e0b65d"),1)

func _self_check() -> void:
    var count: int = 0
    for i in range(6):
        var c: Dictionary = manifest.characters[i]
        var sf: SpriteFrames = load("res://"+c.godot_spriteframes)
        var scene: PackedScene = load("res://"+c.godot_scene)
        var node: Node = scene.instantiate()
        assert(node.get_node("Body").position == Vector2(-32,-54))
        node.free()
        for d in ["south","east","north","west"]:
            for action in ["idle","walk"]:
                var key: String = action+"_"+d
                assert(sf.has_animation(key))
                assert(sf.get_frame_count(key)==(9 if action=="idle" else 8))
                _transition(i,action,d)
                for ms in range(0,int(clips[c.slug].clips[key].cycle_ms),10):
                    actors[i].time = ms/1000.0
                    var rect: Rect2 = _frame(i)
                    assert(rect.position.x>=0 and rect.position.y>=0 and rect.end.x<=576 and rect.end.y<=512)
                for j in range(sf.get_frame_count(key)):
                    assert(is_equal_approx(sf.get_frame_duration(key,j),0.3 if action=="idle" else 0.1))
                    assert(sf.get_frame_texture(key,j).get_size()==Vector2(64,64))
                count += 1
        _move_actor(i,Vector2(10000,10000))
        var room: Array = manifest.rooms[ROOM_IDS[i]].rect
        assert(actors[i].position.x<=room[0]+room[2]-14)
        assert(actors[i].position.y<=room[1]+room[3]-8)
    assert(manifest.characters[0].pixellab_character_id == "4633c85b-8214-4c72-876f-d434de12e12e")
    _reset()
    print("UNIFIED_MODERN_SELF_CHECK_OK ",count," clips; 408 SpriteFrames; six scenes; frame timing and room bounds")
    get_tree().quit(0)
