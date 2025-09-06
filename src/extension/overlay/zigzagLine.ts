/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { type OverlayTemplate } from '../../component/Overlay'
import { isNumber } from '../../common/utils/typeChecks'
import type { XAxis } from '../../component/XAxis'
import type { YAxis } from '../../component/YAxis'
import type Bounding from '../../common/Bounding'

// Interface cho zigzag configuration
interface ZigzagConfig {
  deviation: number // Phần trăm deviation để xác định pivot points (ví dụ: 0.5 = 0.5%)
  showSwingSize: boolean // Hiển thị swing size labels
  showLabels: boolean // Hiển thị labels (X, A, B, C, D...)
  lineColor: string
  lineWidth: number
  labelColor: string
  labelSize: number
}

const zigzagLine: OverlayTemplate = {
  name: 'zigzagLine',
  totalStep: 1, // Chỉ cần 1 step để vẽ tự động
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,

  createPointFigures: ({ bounding, precision, defaultStyles, overlay, xAxis, yAxis }) => {
    // Lấy config từ extendData hoặc sử dụng default
    const config: ZigzagConfig = {
      deviation: 0.5, // 0.5% deviation
      showSwingSize: true,
      showLabels: true,
      lineColor: '#FFFFFF',
      lineWidth: 1,
      labelColor: '#FFFF00',
      labelSize: 12,
      ...overlay?.extendData?.config,
      ...defaultStyles?.zigzagLine
    }

    // Lấy dữ liệu từ chart để tính toán zigzag
    const chartData = getChartDataForZigzag(xAxis, yAxis, bounding)
    if (chartData === null || chartData.length < 3) {
      return []
    }

    // Tính toán zigzag points từ dữ liệu chart
    const zigzagPoints = calculateZigzagPoints(chartData, config.deviation)

    if (zigzagPoints.length < 2) {
      return []
    }

    const figures: any[] = []

    // Vẽ zigzag line
    figures.push({
      type: 'line',
      attrs: {
        coordinates: zigzagPoints.map(point => ({
          x: point.x,
          y: point.y
        }))
      },
      styles: {
        color: config.lineColor,
        size: config.lineWidth
      }
    })

    // Vẽ swing size labels và point labels
    if (config.showSwingSize || config.showLabels) {
      zigzagPoints.forEach((point) => {
        const labelTexts: string[] = []

        if (config.showLabels && point.label !== undefined) {
          labelTexts.push(point.label)
        }

        if (config.showSwingSize && isNumber(point.swingSize)) {
          labelTexts.push(point.swingSize.toFixed(precision.price))
        }

        if (labelTexts.length > 0) {
          figures.push({
            type: 'text',
            attrs: {
              x: point.x + 5, // Offset để không che line
              y: point.y - 10,
              text: labelTexts.join('\n'),
              align: 'left',
              baseline: 'bottom'
            },
            styles: {
              color: config.labelColor,
              size: config.labelSize,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingLeft: 4,
              paddingTop: 2,
              paddingRight: 4,
              paddingBottom: 2
            }
          })
        }
      })
    }

    return figures
  }
}

/**
 * Lấy dữ liệu chart để tính toán zigzag
 */
function getChartDataForZigzag (xAxis: XAxis | null, yAxis: YAxis | null, bounding: Bounding): Array<{ x: number, y: number, timestamp?: number, value?: number }> | null {
  if (xAxis === null || yAxis === null) {
    return null
  }

  // Lấy dữ liệu từ chart data
  const chartData = (xAxis as any).getDataList()
  if (chartData === null || chartData.length === 0) {
    return null
  }

  // Chuyển đổi dữ liệu thành coordinates
  const coordinates: Array<{ x: number, y: number, timestamp?: number, value?: number }> = []
  for (let i = 0; i < chartData.length; i++) {
    const data = chartData[i]
    const x = xAxis.convertToPixel(Number(data.timestamp))
    const y = yAxis.convertToPixel(Number(data.close)) // Sử dụng giá close

    // Chỉ lấy các điểm trong bounding
    if (x >= 0 && x <= bounding.width) {
      coordinates.push({
        x,
        y,
        timestamp: data.timestamp,
        value: data.close
      })
    }
  }

  return coordinates
}

/**
 * Tính toán zigzag points từ dữ liệu giá
 */
function calculateZigzagPoints (coordinates: Array<{ x: number, y: number, timestamp?: number, value?: number }>, deviation: number): Array<{ x: number, y: number, swingSize?: number, label?: string }> {
  if (coordinates.length < 3) {
    return coordinates.map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      label: index === 0 ? 'X' : undefined
    }))
  }

  const points: Array<{ x: number, y: number, swingSize?: number, label?: string }> = []
  let lastPivotIndex = 0
  let lastPivotValue = coordinates[0].y
  let isUpward = true // Direction của trend
  let labelCounter = 0
  const labels = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

  // Thêm điểm đầu tiên
  points.push({
    x: coordinates[0].x,
    y: coordinates[0].y,
    label: labels[labelCounter++]
  })

  // Tìm điểm pivot đầu tiên để xác định hướng
  let firstPivotIndex = 0
  let firstPivotValue = coordinates[0].y
  let foundFirstPivot = false

  for (let i = 1; i < coordinates.length && !foundFirstPivot; i++) {
    const currentValue = coordinates[i].y
    const deviationThreshold = Math.abs(firstPivotValue) * (deviation / 100)

    if (currentValue > firstPivotValue) {
      firstPivotValue = currentValue
      firstPivotIndex = i
    } else if (firstPivotValue - currentValue >= deviationThreshold) {
      // Tìm thấy đỉnh đầu tiên
      const swingSize = firstPivotValue - points[0].y
      points.push({
        x: coordinates[firstPivotIndex].x,
        y: coordinates[firstPivotIndex].y,
        swingSize,
        label: labels[labelCounter++]
      })

      isUpward = false
      lastPivotValue = currentValue
      lastPivotIndex = i
      foundFirstPivot = true
    }
  }

  // Nếu không tìm thấy pivot đầu tiên, thêm điểm cuối
  if (!foundFirstPivot) {
    const lastIndex = coordinates.length - 1
    const swingSize = coordinates[lastIndex].y - points[0].y
    points.push({
      x: coordinates[lastIndex].x,
      y: coordinates[lastIndex].y,
      swingSize,
      label: labels[labelCounter++]
    })
    return points
  }

  // Tiếp tục tìm các pivot points
  for (let i = lastPivotIndex + 1; i < coordinates.length; i++) {
    const currentValue = coordinates[i].y
    const deviationThreshold = Math.abs(lastPivotValue) * (deviation / 100)

    if (isUpward) {
      // Đang tìm đỉnh
      if (currentValue > lastPivotValue) {
        lastPivotValue = currentValue
        lastPivotIndex = i
      } else if (lastPivotValue - currentValue >= deviationThreshold) {
        // Tìm thấy đỉnh, thêm vào points
        const swingSize = lastPivotValue - points[points.length - 1].y
        points.push({
          x: coordinates[lastPivotIndex].x,
          y: coordinates[lastPivotIndex].y,
          swingSize,
          label: labels[labelCounter++]
        })

        isUpward = false
        lastPivotValue = currentValue
        lastPivotIndex = i
      }
    } else {
      // Đang tìm đáy
      if (currentValue < lastPivotValue) {
        lastPivotValue = currentValue
        lastPivotIndex = i
      } else if (currentValue - lastPivotValue >= deviationThreshold) {
        // Tìm thấy đáy, thêm vào points
        const swingSize = points[points.length - 1].y - lastPivotValue
        points.push({
          x: coordinates[lastPivotIndex].x,
          y: coordinates[lastPivotIndex].y,
          swingSize,
          label: labels[labelCounter++]
        })

        isUpward = true
        lastPivotValue = currentValue
        lastPivotIndex = i
      }
    }
  }

  // Thêm điểm cuối cùng nếu cần
  const lastIndex = coordinates.length - 1
  if (lastIndex !== lastPivotIndex) {
    const lastValue = coordinates[lastIndex].y
    const deviationThreshold = Math.abs(lastPivotValue) * (deviation / 100)

    if (isUpward && lastValue - lastPivotValue >= deviationThreshold) {
      const swingSize = lastValue - points[points.length - 1].y
      points.push({
        x: coordinates[lastIndex].x,
        y: coordinates[lastIndex].y,
        swingSize,
        label: labels[labelCounter++]
      })
    } else if (!isUpward && lastPivotValue - lastValue >= deviationThreshold) {
      const swingSize = points[points.length - 1].y - lastValue
      points.push({
        x: coordinates[lastIndex].x,
        y: coordinates[lastIndex].y,
        swingSize,
        label: labels[labelCounter++]
      })
    }
  }

  return points
}

export default zigzagLine
