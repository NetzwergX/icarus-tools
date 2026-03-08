const DEFAULT_EDGE_METHOD = 'YThenX'

export function resolveEdgeMethod(drawMethod) {
  if (drawMethod === 'XThenY') {
    return 'YThenX'
  }

  if (drawMethod === 'YThenX') {
    return 'XThenY'
  }

  if (drawMethod === 'ShortestDistance') {
    return drawMethod
  }

  return DEFAULT_EDGE_METHOD
}

export function buildEdgePath({ fromCenter, method, toCenter }) {
  const effectiveMethod = method ?? DEFAULT_EDGE_METHOD

  if (effectiveMethod === 'ShortestDistance') {
    return `M ${fromCenter.x} ${fromCenter.y} L ${toCenter.x} ${toCenter.y}`
  }

  if (effectiveMethod === 'XThenY') {
    return `M ${fromCenter.x} ${fromCenter.y} L ${toCenter.x} ${fromCenter.y} L ${toCenter.x} ${toCenter.y}`
  }

  return `M ${fromCenter.x} ${fromCenter.y} L ${fromCenter.x} ${toCenter.y} L ${toCenter.x} ${toCenter.y}`
}

export function buildEdgePathWithWaypoints({ fromCenter, toCenter, waypoints, segmentMethods }) {
  const points = [...(waypoints ?? []), toCenter]
  let currentPoint = fromCenter

  return points
    .map((nextPoint, index) => {
      const method = segmentMethods?.[index] ?? DEFAULT_EDGE_METHOD
      const segmentPath = buildEdgePath({ fromCenter: currentPoint, method, toCenter: nextPoint })
      currentPoint = nextPoint
      return segmentPath
    })
    .join(' ')
}
