using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

[DisallowMultipleComponent]
[RequireComponent(typeof(Canvas))]
public class UIManager : MonoBehaviour
{
    private const string MapTexturePath = "unity_500m_map_assets/map_500x500_minimap_512";

    [Header("Scene References")]
    [SerializeField] private Transform player;
    [SerializeField] private RectTransform miniMapRoot;
    [SerializeField] private RectTransform fullMapPanel;
    [SerializeField] private Button fullMapToggleButton;

    [Header("Prototype Input")]
    [SerializeField] private bool addTestPlayerMover = true;
    [SerializeField] private bool toggleFullMapWithM = true;
    [SerializeField] private bool hideHudWhileFullMapOpen = true;

    [Header("Map Settings")]
    [SerializeField, Min(1f)] private float worldSizeMeters = 500f;
    [SerializeField, Min(1f)] private float miniMapVisibleMeters = 85f;
    [SerializeField, Min(1f)] private float fallbackMiniMapSizePixels = 240f;
    [SerializeField, Min(1f)] private float fullMapPanelSize = 720f;
    [SerializeField, Min(0f)] private float fullMapPadding = 30f;
    [SerializeField, Min(0.1f)] private float minFullMapZoom = 0.75f;
    [SerializeField, Min(0.1f)] private float maxFullMapZoom = 3f;
    [SerializeField] private Vector2 mapCalibrationOffsetMeters = new Vector2(2f, -8f);

    private RectTransform canvasRect;
    private RectTransform miniMapContent;
    private RectTransform fullMapImage;
    private RectTransform fullMapPlayerIcon;
    private float miniPixelsPerMeter;
    private float fullMapBaseSize;
    private float fullMapZoom = 1f;
    private Vector2 fullMapPan;
    private bool fullMapVisible;
    private readonly Dictionary<GameObject, bool> hudRootActiveStates = new Dictionary<GameObject, bool>();

    private void OnEnable()
    {
        if (fullMapToggleButton != null)
        {
            fullMapToggleButton.onClick.AddListener(ToggleFullMap);
        }
    }

    private void OnDisable()
    {
        if (fullMapToggleButton != null)
        {
            fullMapToggleButton.onClick.RemoveListener(ToggleFullMap);
        }
    }

    private void Awake()
    {
        canvasRect = transform as RectTransform;
        if (canvasRect == null)
        {
            Debug.LogWarning("UIManager must be attached to a Canvas RectTransform.");
            enabled = false;
            return;
        }

        ResolvePlayer();
        EnsureTestPlayerMover();
        BuildMapUi();
    }

    private void Update()
    {
        if (toggleFullMapWithM)
        {
            Keyboard keyboard = Keyboard.current;
            if (keyboard != null && keyboard.mKey.wasPressedThisFrame)
            {
                ToggleFullMap();
            }
        }

        HandleFullMapInput();
        UpdateMiniMap();
        UpdateFullMap();
    }

    public void ToggleFullMap()
    {
        SetFullMapVisible(!fullMapVisible);
    }

    public void SetFullMapVisible(bool visible)
    {
        fullMapVisible = visible;

        if (visible)
        {
            HideHudRootsForFullMap();
        }
        else
        {
            RestoreHudRootsAfterFullMap();
        }

        if (fullMapPanel != null)
        {
            if (fullMapVisible)
            {
                fullMapPanel.SetAsLastSibling();
            }

            fullMapPanel.gameObject.SetActive(fullMapVisible);
        }
    }

    private void ResolvePlayer()
    {
        if (player != null)
        {
            return;
        }

        GameObject playerObject = GameObject.Find("Player");
        if (playerObject != null)
        {
            player = playerObject.transform;
        }
    }

    private void EnsureTestPlayerMover()
    {
        if (!addTestPlayerMover || player == null || player.GetComponent<RonPlayerMover>() != null)
        {
            return;
        }

        player.gameObject.AddComponent<RonPlayerMover>();
    }

    private void BuildMapUi()
    {
        Texture2D mapTexture = Resources.Load<Texture2D>(MapTexturePath);
        if (mapTexture == null)
        {
            Debug.LogWarning($"Minimap texture not found at Resources/{MapTexturePath}.");
            return;
        }

        miniMapRoot = ResolveMiniMapRoot();
        BuildMiniMap(mapTexture);
        BuildFullMap(mapTexture);
        SetFullMapVisible(false);
    }

    private RectTransform ResolveMiniMapRoot()
    {
        if (miniMapRoot != null)
        {
            return miniMapRoot;
        }

        RectTransform found = FindChildRect(canvasRect, "MiniMap");
        if (found != null)
        {
            return found;
        }

        return CreateRect("MiniMap", canvasRect, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(18f, -18f), Vector2.one * fallbackMiniMapSizePixels, new Vector2(0f, 1f));
    }

    private void BuildMiniMap(Texture2D mapTexture)
    {
        EnsureImage(miniMapRoot, new Color(0.03f, 0.05f, 0.06f, 0.92f), false);

        Mask mask = miniMapRoot.GetComponent<Mask>();
        if (mask == null)
        {
            mask = miniMapRoot.gameObject.AddComponent<Mask>();
        }
        mask.showMaskGraphic = true;

        float miniMapSize = GetUsableSize(miniMapRoot, fallbackMiniMapSizePixels);
        miniPixelsPerMeter = miniMapSize / miniMapVisibleMeters;

        miniMapContent = EnsureChildRect("MapContent", miniMapRoot, Vector2.one * (worldSizeMeters * miniPixelsPerMeter));
        miniMapContent.SetAsFirstSibling();

        RectTransform mapImage = EnsureRawImageChild("MapImage", miniMapContent, mapTexture, miniMapContent.sizeDelta);
        mapImage.anchoredPosition = Vector2.zero;

        RectTransform playerIcon = EnsureImageChild("PlayerIcon", miniMapRoot, new Vector2(12f, 12f), new Color(0.2f, 0.95f, 1f, 1f));
        playerIcon.anchoredPosition = Vector2.zero;
        playerIcon.SetAsLastSibling();
    }

    private void BuildFullMap(Texture2D mapTexture)
    {
        if (fullMapPanel == null)
        {
            fullMapPanel = FindChildRect(canvasRect, "FullMapPanel");
        }

        if (fullMapPanel == null)
        {
            fullMapPanel = CreateRect("FullMapPanel", canvasRect, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.one * fullMapPanelSize, new Vector2(0.5f, 0.5f));
            Image panelImage = EnsureImage(fullMapPanel, Color.clear, true);
            panelImage.raycastTarget = false;
        }
        else
        {
            Image panelImage = EnsureImage(fullMapPanel, Color.clear, true);
            panelImage.raycastTarget = false;
        }

        Mask oldMask = fullMapPanel.GetComponent<Mask>();
        if (oldMask != null)
        {
            Destroy(oldMask);
        }

        if (fullMapPanel.GetComponent<RectMask2D>() == null)
        {
            fullMapPanel.gameObject.AddComponent<RectMask2D>();
        }

        fullMapBaseSize = Mathf.Max(1f, GetUsableSize(fullMapPanel, fullMapPanelSize) - fullMapPadding * 2f);
        fullMapImage = EnsureRawImageChild("MapImage", fullMapPanel, mapTexture, Vector2.one * fullMapBaseSize);
        fullMapImage.SetAsFirstSibling();

        fullMapPlayerIcon = EnsureImageChild("PlayerIcon", fullMapImage, new Vector2(20f, 20f), new Color(0.2f, 0.95f, 1f, 1f));
        fullMapPlayerIcon.SetAsLastSibling();
        ApplyFullMapTransform();
    }

    private void HandleFullMapInput()
    {
        if (!fullMapVisible || fullMapImage == null)
        {
            return;
        }

        Mouse mouse = Mouse.current;
        if (mouse == null)
        {
            return;
        }

        float scroll = mouse.scroll.ReadValue().y;
        if (Mathf.Abs(scroll) > 0.01f)
        {
            float zoomDelta = scroll > 0f ? 0.12f : -0.12f;
            fullMapZoom = Mathf.Clamp(fullMapZoom + zoomDelta, minFullMapZoom, maxFullMapZoom);
            ApplyFullMapTransform();
        }

        if (mouse.leftButton.isPressed)
        {
            fullMapPan += mouse.delta.ReadValue();
            ApplyFullMapTransform();
        }
    }

    private void UpdateMiniMap()
    {
        if (player == null || miniMapContent == null)
        {
            return;
        }

        Vector2 playerMapPosition = WorldToMapPixels(player.position, miniPixelsPerMeter);
        miniMapContent.anchoredPosition = -playerMapPosition;
    }

    private void UpdateFullMap()
    {
        if (player == null || fullMapPlayerIcon == null)
        {
            return;
        }

        float pixelsPerMeter = (fullMapBaseSize * fullMapZoom) / worldSizeMeters;
        fullMapPlayerIcon.anchoredPosition = WorldToMapPixels(player.position, pixelsPerMeter);
    }

    private void ApplyFullMapTransform()
    {
        if (fullMapImage == null)
        {
            return;
        }

        fullMapImage.sizeDelta = Vector2.one * (fullMapBaseSize * fullMapZoom);
        fullMapImage.anchoredPosition = fullMapPan;
    }

    private void HideHudRootsForFullMap()
    {
        if (!hideHudWhileFullMapOpen || canvasRect == null || fullMapPanel == null)
        {
            return;
        }

        hudRootActiveStates.Clear();
        foreach (Transform child in canvasRect)
        {
            if (child == fullMapPanel)
            {
                continue;
            }

            GameObject childObject = child.gameObject;
            hudRootActiveStates[childObject] = childObject.activeSelf;
            childObject.SetActive(false);
        }
    }

    private void RestoreHudRootsAfterFullMap()
    {
        if (!hideHudWhileFullMapOpen)
        {
            return;
        }

        foreach (KeyValuePair<GameObject, bool> state in hudRootActiveStates)
        {
            if (state.Key != null)
            {
                state.Key.SetActive(state.Value);
            }
        }

        hudRootActiveStates.Clear();
    }

    private Vector2 WorldToMapPixels(Vector3 worldPosition, float pixelsPerMeter)
    {
        Vector2 calibratedPosition = new Vector2(worldPosition.x, worldPosition.z) + mapCalibrationOffsetMeters;
        return calibratedPosition * pixelsPerMeter;
    }

    private static float GetUsableSize(RectTransform rect, float fallbackSize)
    {
        float width = rect.rect.width > 1f ? rect.rect.width : rect.sizeDelta.x;
        float height = rect.rect.height > 1f ? rect.rect.height : rect.sizeDelta.y;
        float size = Mathf.Min(Mathf.Abs(width), Mathf.Abs(height));
        return size > 1f ? size : fallbackSize;
    }

    private static RectTransform EnsureChildRect(string name, RectTransform parent, Vector2 size)
    {
        RectTransform rect = FindDirectChildRect(parent, name);
        if (rect == null)
        {
            rect = CreateRect(name, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, size, new Vector2(0.5f, 0.5f));
        }

        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.sizeDelta = size;
        return rect;
    }

    private static RectTransform EnsureRawImageChild(string name, RectTransform parent, Texture texture, Vector2 size)
    {
        RectTransform rect = EnsureChildRect(name, parent, size);
        RawImage image = rect.GetComponent<RawImage>();
        if (image == null)
        {
            image = rect.gameObject.AddComponent<RawImage>();
        }

        image.texture = texture;
        image.color = Color.white;
        return rect;
    }

    private static RectTransform EnsureImageChild(string name, RectTransform parent, Vector2 size, Color color)
    {
        RectTransform rect = EnsureChildRect(name, parent, size);
        Image image = EnsureImage(rect, color, true);
        image.raycastTarget = false;
        return rect;
    }

    private static Image EnsureImage(RectTransform rect, Color color, bool overwriteColor)
    {
        Image image = rect.GetComponent<Image>();
        if (image == null)
        {
            image = rect.gameObject.AddComponent<Image>();
            image.color = color;
        }
        else if (overwriteColor)
        {
            image.color = color;
        }

        return image;
    }

    private static RectTransform FindChildRect(Transform parent, string childName)
    {
        foreach (Transform child in parent)
        {
            if (child.name == childName && child.TryGetComponent(out RectTransform rect))
            {
                return rect;
            }

            RectTransform nested = FindChildRect(child, childName);
            if (nested != null)
            {
                return nested;
            }
        }

        return null;
    }

    private static RectTransform FindDirectChildRect(Transform parent, string childName)
    {
        Transform child = parent.Find(childName);
        return child != null && child.TryGetComponent(out RectTransform rect) ? rect : null;
    }

    private static RectTransform CreateRect(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPosition, Vector2 size, Vector2 pivot)
    {
        GameObject obj = new GameObject(name, typeof(RectTransform));
        RectTransform rect = obj.GetComponent<RectTransform>();
        rect.SetParent(parent, false);
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.pivot = pivot;
        rect.anchoredPosition = anchoredPosition;
        rect.sizeDelta = size;
        rect.localScale = Vector3.one;
        return rect;
    }
}
