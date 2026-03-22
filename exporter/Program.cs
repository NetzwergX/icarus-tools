using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;

var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

var gamePath = OperatingSystem.IsWindows()
    ? @"C:\Program Files (x86)\Steam\steamapps\common\Icarus"
    : Path.Combine(home, ".local/share/Steam/steamapps/common/Icarus");

var outputPath = Path.Combine(home, "IcarusExport");

bool isInteractive = !Console.IsOutputRedirected;

void Log(string message)
{
    if (isInteractive)
        Console.WriteLine(message);
    else
        Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}] {message}");
}

void Progress(int current, int total, string currentFile)
{
    if (isInteractive)
        Console.Write($"\r[{current}/{total}] {currentFile,-60}");
    else
        Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}] [{current}/{total}] {currentFile}");
}

using var http = new HttpClient();
http.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

// zlib-ng2.dll is required by CUE4Parse to decompress zlib-compressed PAK entries.
// Zlib-ng.NET (NuGet) is just a managed wrapper — the native DLL is not bundled with it.
var zlibDest = Path.Combine(AppContext.BaseDirectory, "zlib-ng2.dll");
if (!File.Exists(zlibDest))
{
    try
    {
        Log("Downloading zlib-ng2.dll...");
        var zipBytes = await http.GetByteArrayAsync(
            "https://github.com/zlib-ng/zlib-ng/releases/download/2.3.3/zlib-ng-win-x86-64.zip");
        using var zip = new System.IO.Compression.ZipArchive(new MemoryStream(zipBytes));
        var entry = zip.Entries.FirstOrDefault(e =>
            e.FullName.Contains("bin/", StringComparison.OrdinalIgnoreCase) &&
            e.Name.EndsWith(".dll", StringComparison.OrdinalIgnoreCase) &&
            e.Name.StartsWith("zlib", StringComparison.OrdinalIgnoreCase));
        if (entry != null)
        {
            using var src = entry.Open();
            using var dst = File.Create(zlibDest);
            await src.CopyToAsync(dst);
            Log($"zlib-ng2.dll downloaded (from {entry.FullName}).");
        }
        else Log("WARN: No zlib DLL found in release archive.");
    }
    catch (Exception ex) { Log($"WARN: zlib-ng2.dll download failed: {ex.Message}"); }
}
CUE4Parse.Compression.ZlibHelper.Initialize(zlibDest);
Log("Zlib initialized.");

// Oodle is needed for Oodle-compressed uassets (most game pak content).
var oodleDest = Path.Combine(AppContext.BaseDirectory, "oo2core_9_win64.dll");
if (!File.Exists(oodleDest))
{
    try
    {
        Log("Attempting to download Oodle...");
        var bytes = await http.GetByteArrayAsync("https://origin.warframe.com/Tools/oo2core_9_win64.dll");
        File.WriteAllBytes(oodleDest, bytes);
        Log("Oodle downloaded.");
    }
    catch (Exception ex) { Log($"WARN: Oodle download failed: {ex.Message}"); }
}
if (File.Exists(oodleDest))
{
    CUE4Parse.Compression.OodleHelper.Initialize(oodleDest);
    Log("Oodle initialized.");
}

// Clean output directory
if (Directory.Exists(outputPath))
{
    Log("Cleaning output directory...");
    Directory.Delete(outputPath, recursive: true);
}
Directory.CreateDirectory(outputPath);

Log("Initializing provider...");

var provider = new DefaultFileProvider(
    gamePath,
    SearchOption.AllDirectories,
    isCaseInsensitive: true,
    versions: new VersionContainer(EGame.GAME_UE4_27)
);

provider.Initialize();

Log($"Loaded PAKs ({provider.UnloadedVfs.Count()} found):");
foreach (var vfs in provider.UnloadedVfs)
    Log($"  {vfs.Path}");

Log("Mounting PAKs...");
provider.Mount();

Log($"Mounted PAKs ({provider.MountedVfs.Count()} mounted):");
foreach (var vfs in provider.MountedVfs)
    Log($"  {vfs.Path}");

var packages = provider.Files.Keys
    .Select(x => x.TrimStart('/').Split('/')[0])
    .Distinct()
    .OrderBy(x => x)
    .ToList();

Log($"Found top-level packages ({packages.Count}):");
foreach (var pkg in packages)
    Log($"  {pkg}");

var uassets = provider.Files.Keys.Where(x => x.EndsWith(".uasset")).ToList();
var rawFiles = provider.Files.Keys.Where(x =>
    !x.EndsWith(".uasset") &&
    !x.EndsWith(".uexp") &&
    !x.EndsWith(".ubulk") &&
    !x.EndsWith(".uptnl")
).ToList();

int total = uassets.Count + rawFiles.Count;
int processed = 0;
int failed = 0;

var successByExt = new Dictionary<string, int>();
var failByExt = new Dictionary<string, int>();
var createdDirs = new HashSet<string>();

void Track(Dictionary<string, int> dict, string file)
{
    var ext = Path.GetExtension(file).ToLowerInvariant();
    if (string.IsNullOrEmpty(ext)) ext = "(no ext)";
    dict[ext] = dict.GetValueOrDefault(ext) + 1;
}

void EnsureDir(string dir)
{
    if (createdDirs.Add(dir))
        Directory.CreateDirectory(dir);
}

Log($"Found {uassets.Count} uassets and {rawFiles.Count} raw files. Starting export...");

foreach (var file in uassets)
{
    processed++;
    Progress(processed, total, Path.GetFileName(file));

    try
    {
        var pkg = provider.LoadPackage(file);
        var exports = pkg.GetExports();
        var json = JsonConvert.SerializeObject(exports, Formatting.Indented);
        var relativePath = Path.ChangeExtension(file.TrimStart('/'), ".json");
        var outFile = Path.Combine(outputPath, relativePath);
        EnsureDir(Path.GetDirectoryName(outFile)!);
        File.WriteAllText(outFile, json);
        Track(successByExt, file);
    }
    catch (Exception ex)
    {
        if (isInteractive) Console.WriteLine();
        Log($"WARN: [{ex.GetType().Name}] {ex.Message} -- {file}");
        Track(failByExt, file);
        failed++;
    }
}

foreach (var file in rawFiles)
{
    processed++;
    Progress(processed, total, Path.GetFileName(file));

    try
    {
        var data = provider.Files[file].Read();
        var outFile = Path.Combine(outputPath, file.TrimStart('/'));
        EnsureDir(Path.GetDirectoryName(outFile)!);
        File.WriteAllBytes(outFile, data);
        Track(successByExt, file);
    }
    catch (Exception ex)
    {
        if (isInteractive) Console.WriteLine();
        Log($"WARN: [{ex.GetType().Name}] {ex.Message} -- {file}");
        Track(failByExt, file);
        failed++;
    }
}

if (isInteractive) Console.WriteLine();
Log($"Export complete. {processed - failed}/{total} succeeded, {failed} failed.");
Log("");
Log($"{"Extension",-15} {"Success",8} {"Failed",8} {"Total",8}");
Log($"{new string('-', 41)}");

var allExts = successByExt.Keys.Union(failByExt.Keys).OrderBy(x => x);
foreach (var ext in allExts)
{
    successByExt.TryGetValue(ext, out var s);
    failByExt.TryGetValue(ext, out var f);
    Log($"{ext,-15} {s,8} {f,8} {s + f,8}");
}
Log($"{new string('-', 41)}");
Log($"{"TOTAL",-15} {processed - failed,8} {failed,8} {total,8}");