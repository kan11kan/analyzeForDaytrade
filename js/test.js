
    const ONEDAY = document.getElementById('ONEDAY');

    function csv_data(dataPath) {
        const request = new XMLHttpRequest(); // HTTPでファイルを読み込む
        request.addEventListener('load', (event) => { // ロードさせ実行
            const response = event.target.responseText; // 受け取ったテキストを返す



            //----------------------------------- ここからデータ処理のプログラム記述　-----------------------------------

            //responseで受け取ったcsvデータを1行毎のデータ（改行）に変換し、"（ダブルクオート）でデータを要素毎に分割する。
            //数字にカンマが含まれているので、数字データの場合はカンマを取り除いた後、カンマ毎に分けて要素を取り出す。
            //（タイトル列と最後の空白行を削除）
            const convertedData = response.split('\n').map(el => el.split('"'))
                .map(element => element.map((e, i) => (i === 15 || i === 17 || i === 19 || i === 21 || i === 23) ?
                    parseFloat(e.replace(/,/g, ''), 10) : e).join('').split(',')).slice(1, -1);
            //console.log(convertedData);




            //約定毎のデータを1取引毎のデータにするために、何番目の約定データまでが一塊なのかを判定する関数を作成
            //配列をオーダー毎に分けるためのスライスナンバーを配列に格納して返す関数を作成
            const getSliceNum = () => {
                const separateNums = []
                convertedData.reduce((a, b, j) => {
                    if (parseFloat(a[10]) <= 999
                        && parseFloat(a[10]) * 10 + 5 >= parseFloat(b[10]) * 10
                        && parseFloat(a[10]) * 10 - 5 <= parseFloat(b[10]) * 10) {
                        return b
                    }
                    if (parseFloat(a[10]) > 999
                        && parseFloat(a[10]) + 1 >= parseFloat(b[10])
                        && parseFloat(a[10]) - 1 <= parseFloat(b[10])
                    ) {
                        return b
                    }
                    separateNums.push(j)
                    return b
                }, 0)
                separateNums.push(convertedData.length)
                return separateNums
            }
            //console.log(getSliceNum())



            //convertedDataを1トランザクション毎にまとめて配列で返す関数を作成
            const getTransactions = () => {
                const tmp = []
                getSliceNum().reduce((a, b) => {
                    tmp.push(convertedData.slice(a, b))
                    return b
                })
                return tmp
            }
            //console.log(getTransactions())





            //約定データをまとめた1トランザクションの配列からN番目の要素（利益、株数など）を取り出す関数を作成
            //N = 0　 → 約定日
            //N = 1　 → 決済日
            //N = 2　 → 銘柄コード
            //N = 3　 → 銘柄名
            //N = 4　 → 口座区分
            //N = 5　 → 信用区分
            //N = 6　 → 買い埋め,売り埋め
            //N = 7　 → 株数
            //N = 8　 → 決済単価
            //N = 9　 → 合計金額
            //N = 10　→ 取得単価
            //N = 11　→ 損益


            const getElementsFromOneOrder = (array, N) => {
                return array.map(el => el[N])
            }
            //console.log(getElementsFromOneOrder(getTransactions()[0],11))



            //配列の中の値を実数に変換する関数を作成
            const convertToFloat = array => {
                return array.map(el => parseFloat(el))
            }
            //console.log(convertToFloat(getElementsFromOneOrder(getTransactions(),11)[0]))



            //実数を合計する関数を作成
            const calcSum = array => {
                return array.reduce((a, b) => a + b)
            }


            //約定データの多重配列を入れると1取引のトータルの株数を出力する関数を作成
            const getTotalStockAmount = array => {
                const stockAmountFromOneOrder = getElementsFromOneOrder(array, 7)
                return calcSum(convertToFloat(stockAmountFromOneOrder))
            }
            //console.log(getTotalStockAmount(getTransactions()[0]))



            //1トランザクションの配列を入れるとトータルの損益を出力する関数を作成
            const getOneTransacionPL = array => {
                const PLFromOneOrder = getElementsFromOneOrder(array, 11)
                return calcSum(convertToFloat(PLFromOneOrder))
            }
            //console.log(getOneTransacionPL(getTransactions()[0]))




            //1トランザクションの配列を入れるとトータルの取引（購入）金額を出力する関数を作成
            const getOneTransactionCashAmount = array => {
                const purchasePriceFromOneOrder = getElementsFromOneOrder(array, 9)
                return calcSum(convertToFloat(purchasePriceFromOneOrder))
            }
            //console.log(getOneTransactionCashAmount(getTransactions()[0]))




            //1トランザクションの配列を入れると1取引のトータルの損益を出力する関数を作成
            const getOneTransactionBPS = array => {
                const bps = Math.floor(getOneTransacionPL(array) / getOneTransactionCashAmount(array) * 10000)
                return bps
            }
            //console.log(getOneTransactionBPS(getTransactions()[0]))



            //オーダー毎に[約定日、銘柄コード、銘柄名、損益、bps]をまとめる
            const getSumrizeByOrder = array => {
                return array.map(el => [el[0][0], el[0][2], el[0][3], el[0][10], el[0][8], el[0][6],
                getTotalStockAmount(el), getOneTransacionPL(el), getOneTransactionCashAmount(el), getOneTransactionBPS(el)]
                )
            }
            //console.log(getSumrizeByOrder(getTransactions()))



            //数字を文字列に変換して3桁区切りでカンマを挿入して文字列で返す関数を作成
            const getCommaNum = (num) => {
                const tmpNum = Math.abs(num)
                const digits = String(Math.floor(tmpNum)).length
                const flooredNumArray = String(Math.floor(num)).split('')
                const fraction = num - Math.floor(num)


                if (digits <= 3) return String(num)
                if (digits > 3 && digits <= 6) {
                    flooredNumArray.splice(-3, 0, ',')
                    return flooredNumArray.join('')
                } else if (digits > 6 && digits <= 9) {
                    flooredNumArray.splice(-3, 0, ',')
                    flooredNumArray.splice(-7, 0, ',')
                    return flooredNumArray.join('')
                } else {
                    flooredNumArray.splice(-3, 0, ',')
                    flooredNumArray.splice(-7, 0, ',')
                    flooredNumArray.splice(-11, 0, ',')
                    return flooredNumArray.join('')
                }
            }
            //console.log(getCommaNum(33323435130.4))


            //1日のトータルの損益、損益比、勝率を出力する関数を作成
            const getOnedaySumrize = array => {
                // 勝ちの数と負けの数を返す関数を作成
                const getWinNum = array => {
                    let count = 0
                    array.forEach(el => el[7] > 0 ? count += 1 : count)
                    return [count, array.length - count]
                }
                // console.log(getWinNum(getSumrizeByOrder(getTransactions())))
                // console.log(getSumrizeByOrder(getTransactions()))
                //
                const onedayPL = array.reduce((a, b) => {
                    return a + b[7]
                }, 0)
                console.log(onedayPL)


                const onedayPurchasePrice = array.reduce((a, b) => {
                    return a + b[8]
                }, 0)
                //console.log(onedayPurchasePrice)

                const onedayWinPercent = array => {
                    return Math.floor(getWinNum(array)[0] / array.length * 100)
                }


                const getPLRate = (array) => {
                    let plus = [0]
                    let minus = [0]
                    array.forEach(el => {
                        el[7] > 0 ? plus.push(el[7]) : minus.push(el[7])
                    })
                    return Math.round(((plus.reduce((a, b) => a + b)) / getWinNum(array)[0])
                        / Math.abs((minus.reduce((c, d) => c + d)) / getWinNum(array)[1]) * 100) / 100
                }


                const onedayBps = Math.floor(onedayPL / onedayPurchasePrice * 10000)


                //最後にまとめて出力する
                return [onedayPL, onedayBps, onedayWinPercent(array), getPLRate(array)]

            }
            //console.log(getOnedaySumrize(getSumrizeByOrder(getTransactions())))




            const adjust = [getSumrizeByOrder(getTransactions())]




            const showOneday = getOnedaySumrize(getSumrizeByOrder(getTransactions()))
            const convertOnedayToHTML = () => {
                return '<table border = "1" >' +
                    '<thead>' +
                    '<tr>' +
                    '<th>' +
                    "Total Return" +
                    '</th>' +
                    '<th>' +
                    'BPS' +
                    '</th>' +
                    '<th>' +
                    'Win Rate' +
                    '</th>' +
                    '<th>' +
                    'PL Rate' +
                    '</th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                    '<tr>' +
                    '<td>' +
                    showOneday[0] +
                    '</td>' +
                    '<td>' +
                    showOneday[1] +
                    '</td>' +
                    '<td>' +
                    showOneday[2] + '% ' +
                    '</td>' +
                    '<td>' +
                    showOneday[3] +
                    '</td>' +
                    '</tr>' +
                    '</tbody>' +
                    '</table >'
            }
            // console.log(convertOnedayToHTML())


            const convertOrdersToHTML = (array) => {
                const tmp = array.map((el, i) => {
                    el.unshift(i + 1)
                    return el.map((e, j) => {
                        if (j === 4 || j === 5 || j === 7 || j === 8 || j === 9) return '<td>' + getCommaNum(e) + '</td>'
                        return '<td>' + e + '</td>'
                    })
                })
                //console.log(tmp)
                return '<table border = "2">' +
                    '<thead>' +
                    '<tr>' +
                    '<th>' +
                    'Order.No' +
                    '</th>' +
                    '<th>' +
                    'DATE' +
                    '</th>' +
                    '<th>' +
                    'CORD' +
                    '</th>' +
                    '<th>' +
                    'NAME' +
                    '</th>' +
                    '<th>' +
                    'IN' +
                    '</th>' +
                    '<th>' +
                    'OUT' +
                    '</th>' +
                    '<th>' +
                    'TRANSACTION' +
                    '</th>' +
                    '<th>' +
                    'Stock Amount' +
                    '</th>' +
                    '<th>' +
                    'PL' +
                    '</th>' +
                    '<th>' +
                    'Cash Amount' +
                    '</th>' +
                    '<th>' +
                    'BPS' +
                    '</th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                    tmp.map((e, j) => {
                        // if(j === 1)
                        return '<tr align="right">' + e.join('') + '</tr>'
                    }).join('')
                '</tbody>' +
                    '</table>'
            }
            //console.log(convertOrdersToHTML(getSumrizeByOrder(getTransactions())))
            //console.log(getSumrizeByOrder(getTransactions()))

            ORDERS.innerHTML = convertOrdersToHTML(getSumrizeByOrder(getTransactions()));
            ONEDAY.innerHTML = convertOnedayToHTML();
        });
        request.open('GET', dataPath, true); // csvのパスを指定
        request.send();
    }
    csv_data('csv_data/example1.csv');